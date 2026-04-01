import { getMetadataArgsStorage } from 'typeorm';
import type {
  EntityConstructor,
  EntityInstance,
  MapToInstanceArrays,
  MapToInstances,
  SeedContext,
  SeedFactory,
} from './registry.js';
import { getSeeds } from './registry.js';

/**
 * A map of property overrides for seeded entities.
 * Each property can be either a static value or a {@link SeedFactory} that is called
 * once per entity — enabling unique random values across each created instance.
 *
 * @example
 * // All 10 bookings get a unique random price
 * await seed(Booking).saveMany(10, {
 *   dataSource,
 *   values: { price: () => faker.number.float({ min: 10, max: 500 }) },
 * })
 */
export type SeedValues<T extends EntityInstance> = {
  [K in keyof T]?: T[K] | SeedFactory<T[K], T>;
};

/**
 * Options for {@link create} and {@link createMany} on the single-class form.
 * Extends {@link SeedContext} with a typed `values` override map.
 */
export interface CreateOptions<T extends EntityInstance> extends SeedContext {
  /**
   * Property values to apply after all `@Seed` factories have run.
   * Wins unconditionally — factories still execute but their output is overwritten.
   * Also works for properties that have no `@Seed` decorator.
   *
   * @example
   * const user = await dataSource.getRepository(User).findOneByOrFail({ name: 'Alice' })
   * const post = await seed(Post).create({ values: { author: user } })
   */
  values?: SeedValues<T>;
}

/** Options for {@link createMany}. Extends {@link SeedContext} with a required instance count. */
export interface CreateManyOptions<T extends EntityInstance = EntityInstance> extends SeedContext {
  count: number;
  values?: SeedValues<T>;
}

// Internal extension of SeedContext — never exposed in the public API.
interface InternalContext extends SeedContext {
  _ancestors: Set<Function>;
}

/** Extracts the ancestor set from an internal context, returning an empty set for external callers. */
function getAncestors(context: SeedContext): Set<Function> {
  return (context as InternalContext)._ancestors ?? new Set();
}

/**
 * Applies a {@link SeedValues} map to an instance.
 * Factory entries are called once per instance so each entity can get unique values.
 */
async function applyValues<T extends EntityInstance>(
  instance: T,
  values: SeedValues<T>,
  context: SeedContext,
  index: number,
): Promise<void> {
  const record = instance as Record<string | symbol, unknown>;

  for (const key of Object.keys(values) as (keyof T & string)[]) {
    const value = values[key];

    if (typeof value === 'function') {
      record[key] = await (value as SeedFactory)(context, instance, index);
    } else {
      record[key] = value;
    }
  }
}

/** Returns a new context with `cls` added to the ancestor set, used to detect circular relation chains. */
function withAncestor(context: SeedContext, cls: Function): InternalContext {
  const ancestors = getAncestors(context);

  return { ...context, _ancestors: new Set([...ancestors, cls]) };
}

/** Walks the prototype chain and returns all classes from `target` up to (but not including) `Function.prototype`. */
function getClassHierarchy(target: Function): Function[] {
  const hierarchy: Function[] = [];
  let current: Function = target;

  while (current && current !== Function.prototype) {
    hierarchy.push(current);
    current = Object.getPrototypeOf(current) as Function;
  }

  return hierarchy;
}

/**
 * Creates one fully populated instance of `EntityClass` in memory.
 *
 * Runs in three steps:
 * 1. Factory-decorated properties (`@Seed(factory)`) — run first, in declaration order.
 * 2. Embedded types (`@Embedded`) — auto-seeded if the embedded class has any `@Seed` entries.
 * 3. Bare relation decorators (`@Seed()` without a factory) — skipped when `relations` is `false`,
 *    and also skipped for any related class already present in the ancestor chain (circular guard).
 */
async function createOne<T extends EntityInstance>(
  EntityClass: EntityConstructor<T>,
  context: SeedContext,
  index = 0,
): Promise<T> {
  const instance = new EntityClass();
  const ancestors = getAncestors(context);
  const childContext = withAncestor(context, EntityClass);
  const storage = getMetadataArgsStorage();
  const relations = storage.filterRelations(getClassHierarchy(EntityClass));
  const seededProperties = new Set<string | symbol>();
  const record = instance as Record<string | symbol, unknown>;

  // Step 1: Run @Seed entries that have an explicit factory.
  for (const { propertyKey, factory } of getSeeds(EntityClass)) {
    if (!factory) {
      continue;
    }

    record[propertyKey] = await factory(context, instance, index);
    seededProperties.add(propertyKey);
  }

  // Step 2: Auto-seed TypeORM embedded properties not already covered by Step 1.
  for (const embedded of storage.filterEmbeddeds(EntityClass)) {
    if (seededProperties.has(embedded.propertyName)) {
      continue;
    }

    const EmbeddedClass = embedded.type() as EntityConstructor;

    if (getSeeds(EmbeddedClass).length > 0) {
      record[embedded.propertyName] = await createOne(EmbeddedClass, context);
      seededProperties.add(embedded.propertyName);
    }
  }

  // Step 3: Auto-seed @Seed entries without a factory (relation seeds).
  // Uses the ancestor guard to cut circular chains: if the related class is
  // already being seeded higher up in this call chain, the property is left
  // undefined rather than triggering infinite recursion.
  // Skipped entirely when context.relations === false.
  if (context.relations === false) {
    return instance;
  }

  for (const { propertyKey, factory, options } of getSeeds(EntityClass)) {
    if (factory || seededProperties.has(propertyKey)) {
      continue;
    }

    const relation = relations.find((r) => r.propertyName === String(propertyKey));

    if (!relation || typeof relation.type !== 'function') {
      continue;
    }

    const RelatedClass = (relation.type as () => Function)() as EntityConstructor;

    if (ancestors.has(RelatedClass)) {
      continue;
    }

    const isArray =
      relation.relationType === 'one-to-many' || relation.relationType === 'many-to-many';

    if (isArray) {
      record[propertyKey] = await createMany(RelatedClass, {
        count: options.count ?? 1,
        ...childContext,
      });
    } else {
      record[propertyKey] = await createOne(RelatedClass, childContext);
    }

    seededProperties.add(propertyKey);
  }

  return instance;
}

/**
 * Creates one entity instance in memory without persisting it.
 *
 * When passed an array of classes, relation seeding is disabled by default
 * (pass `relations: true` in the context to override). Returns a tuple of
 * instances in the same order as the input array.
 */
export async function create<T extends EntityInstance>(
  EntityClass: EntityConstructor<T>,
  options?: CreateOptions<T>,
): Promise<T>;
export async function create<T extends readonly EntityConstructor[]>(
  EntityClasses: [...T],
  context?: SeedContext,
): Promise<MapToInstances<T>>;
export async function create<T extends EntityInstance>(
  classOrClasses: EntityConstructor<T> | readonly EntityConstructor[],
  options: CreateOptions<T> = {},
): Promise<T | EntityInstance[]> {
  if (Array.isArray(classOrClasses)) {
    const effectiveContext: SeedContext = { relations: false, ...options };

    return (await Promise.all(
      (classOrClasses as EntityConstructor[]).map((cls) => createOne(cls, effectiveContext)),
    )) as EntityInstance[];
  }

  const { values, ...context } = options as CreateOptions<T>;
  const instance = await createOne(classOrClasses as EntityConstructor<T>, context, 0);

  if (values) {
    await applyValues(instance, values, context, 0);
  }

  return instance;
}

/**
 * Creates multiple entity instances in memory without persisting them.
 *
 * When passed an array of classes, returns a tuple of arrays — one per class — each
 * containing `count` instances. Relation seeding is disabled by default for the
 * array variant; pass `relations: true` in the options to override.
 */
export async function createMany<T extends EntityInstance>(
  EntityClass: EntityConstructor<T>,
  options: CreateManyOptions<T>,
): Promise<T[]>;
export async function createMany<T extends readonly EntityConstructor[]>(
  EntityClasses: [...T],
  options: CreateManyOptions,
): Promise<MapToInstanceArrays<T>>;
export async function createMany<T extends EntityInstance>(
  classOrClasses: EntityConstructor<T> | readonly EntityConstructor[],
  { count, values, ...context }: CreateManyOptions<T>,
): Promise<T[] | EntityInstance[][]> {
  if (Array.isArray(classOrClasses)) {
    const effectiveContext: SeedContext = { relations: false, ...context };

    return (await Promise.all(
      (classOrClasses as EntityConstructor[]).map((cls) =>
        Promise.all(Array.from({ length: count }, (_, i) => createOne(cls, effectiveContext, i))),
      ),
    )) as EntityInstance[][];
  }

  const instances = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      createOne(classOrClasses as EntityConstructor<T>, context, i),
    ),
  );

  if (values) {
    await Promise.all(instances.map((instance, i) => applyValues(instance, values, context, i)));
  }

  return instances;
}
