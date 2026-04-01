import { MetadataStorage, ReferenceKind } from '@mikro-orm/core';
import type {
  EntityConstructor,
  EntityInstance,
  MapToInstanceArrays,
  MapToInstances,
  SeedContext,
  SeedFactory,
} from './registry.js';
import { getSeeds } from './registry.js';

export type SeedValues<T extends EntityInstance> = {
  [K in keyof T]?: T[K] | SeedFactory<T[K], T>;
};

export interface CreateOptions<T extends EntityInstance> extends SeedContext {
  values?: SeedValues<T>;
}

export interface CreateManyOptions<T extends EntityInstance = EntityInstance> extends SeedContext {
  count: number;
  values?: SeedValues<T>;
}

interface InternalContext extends SeedContext {
  _ancestors: Set<Function>;
}

function getAncestors(context: SeedContext): Set<Function> {
  return (context as InternalContext)._ancestors ?? new Set();
}

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

function withAncestor(context: SeedContext, cls: Function): InternalContext {
  const ancestors = getAncestors(context);
  return { ...context, _ancestors: new Set([...ancestors, cls]) };
}

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
 * Returns MikroORM property metadata for all classes in the hierarchy.
 * Properties are keyed by name; later (child) entries override earlier (parent) ones.
 */
function getMikroOrmProperties(
  hierarchy: Function[],
): Record<string, { kind: string; entity?: () => Function }> {
  const result: Record<string, { kind: string; entity?: () => Function }> = {};

  // Walk hierarchy from base to child so child props override parent
  for (const cls of [...hierarchy].reverse()) {
    try {
      const path = (cls as unknown as Record<symbol, unknown>)[
        MetadataStorage.PATH_SYMBOL as symbol
      ] as string | undefined;
      const meta = path ? MetadataStorage.getMetadata(cls.name, path) : null;
      if (meta?.properties) {
        for (const [propName, prop] of Object.entries(meta.properties)) {
          result[propName] = prop as { kind: string; entity?: () => Function };
        }
      }
    } catch {
      // Class not registered with MikroORM
    }
  }

  return result;
}

async function createOne<T extends EntityInstance>(
  EntityClass: EntityConstructor<T>,
  context: SeedContext,
  index = 0,
): Promise<T> {
  const instance = new EntityClass();
  const ancestors = getAncestors(context);
  const childContext = withAncestor(context, EntityClass);
  const hierarchy = getClassHierarchy(EntityClass);
  const properties = getMikroOrmProperties(hierarchy);
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

  // Step 2: Auto-seed MikroORM embedded properties not already covered by Step 1.
  for (const [propName, prop] of Object.entries(properties)) {
    if (prop.kind !== ReferenceKind.EMBEDDED || seededProperties.has(propName)) {
      continue;
    }

    if (typeof prop.entity !== 'function') {
      continue;
    }

    const EmbeddedClass = prop.entity() as EntityConstructor;

    if (getSeeds(EmbeddedClass).length > 0) {
      record[propName] = await createOne(EmbeddedClass, context);
      seededProperties.add(propName);
    }
  }

  // Step 3: Auto-seed @Seed entries without a factory (bare relation seeds).
  if (context.relations === false) {
    return instance;
  }

  for (const { propertyKey, factory, options } of getSeeds(EntityClass)) {
    if (factory || seededProperties.has(propertyKey)) {
      continue;
    }

    const prop = properties[String(propertyKey)];

    if (!prop) {
      continue;
    }

    const isRelation =
      prop.kind === ReferenceKind.MANY_TO_ONE ||
      prop.kind === ReferenceKind.ONE_TO_ONE ||
      prop.kind === ReferenceKind.ONE_TO_MANY ||
      prop.kind === ReferenceKind.MANY_TO_MANY;

    if (!isRelation || typeof prop.entity !== 'function') {
      continue;
    }

    const RelatedClass = prop.entity() as EntityConstructor;

    if (ancestors.has(RelatedClass)) {
      continue;
    }

    const isArray =
      prop.kind === ReferenceKind.ONE_TO_MANY || prop.kind === ReferenceKind.MANY_TO_MANY;

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
