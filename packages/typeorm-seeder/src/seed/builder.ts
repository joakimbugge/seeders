import type { SeedCreateOptions } from './creator.js';
import { createManySeed, createSeed } from './creator.js';
import type { SeedSaveManyOptions, SeedSaveOptions } from './persist.js';
import { saveManySeed, saveSeed } from './persist.js';
import type {
  EntityConstructor,
  EntityInstance,
  MapToInstanceArrays,
  MapToInstances,
  SeedContext,
} from './registry.js';

export type { SeedCreateOptions } from './creator.js';

/** Seed builder for a single entity class. Returned by {@link seed} when passed one class. */
interface SingleSeed<T extends EntityInstance> {
  /** Creates a single instance in memory without persisting. */
  create(context?: SeedCreateOptions<T>): Promise<T>;
  /** Creates and persists a single instance. */
  save(options: SeedSaveOptions<T>): Promise<T>;
  /** Creates multiple instances in memory without persisting. */
  createMany(count: number, context?: SeedCreateOptions<T>): Promise<T[]>;
  /** Creates and persists multiple instances. */
  saveMany(count: number, options: SeedSaveOptions<T>): Promise<T[]>;
}

/**
 * Seed builder for multiple entity classes. Returned by {@link seed} when passed an array.
 * Each method returns a tuple of instances in the same order as the input array.
 * Relation seeding is disabled by default; pass `relations: true` in the context to enable it.
 */
interface MultiSeed<T extends readonly EntityConstructor[]> {
  /** Creates one instance of each class in memory without persisting. */
  create(context?: SeedContext): Promise<MapToInstances<T>>;
  /** Creates and persists one instance of each class. */
  save(options: SeedSaveOptions): Promise<MapToInstances<T>>;
  /** Creates `count` instances of each class in memory without persisting. */
  createMany(count: number, context?: SeedContext): Promise<MapToInstanceArrays<T>>;
  /** Creates and persists `count` instances of each class. */
  saveMany(count: number, options: SeedSaveOptions): Promise<MapToInstanceArrays<T>>;
}

/**
 * Entry point for creating and persisting seed data.
 *
 * Pass a single entity class to get a {@link SingleSeed} builder, or an array of classes
 * to get a {@link MultiSeed} builder that operates on all of them at once.
 *
 * @example
 * // Create one Author in memory (no DB)
 * const author = await seed(Author).create()
 *
 * @example
 * // Persist one Author with all its seeded relations
 * const author = await seed(Author).save({ dataSource })
 *
 * @example
 * // Persist 10 Authors
 * const authors = await seed(Author).saveMany(10, { dataSource })
 *
 * @example
 * // Create multiple entity classes at once (relations disabled by default)
 * const [user, post] = await seed([User, Post]).create()
 */
export function seed<T extends EntityInstance>(EntityClass: EntityConstructor<T>): SingleSeed<T>;
export function seed<T extends readonly EntityConstructor[]>(EntityClasses: [...T]): MultiSeed<T>;
export function seed<T extends EntityInstance>(
  classOrClasses: EntityConstructor<T> | readonly EntityConstructor[],
): SingleSeed<T> | MultiSeed<readonly EntityConstructor[]> {
  if (Array.isArray(classOrClasses)) {
    const classes = classOrClasses as readonly EntityConstructor[];

    return {
      create: (context?: SeedContext) =>
        createSeed(classes as [...typeof classes], context) as Promise<
          MapToInstances<typeof classes>
        >,
      save: (options: SeedSaveOptions) =>
        saveSeed(classes as [...typeof classes], options) as Promise<
          MapToInstances<typeof classes>
        >,
      createMany: (count: number, context?: SeedContext) =>
        createManySeed(classes as [...typeof classes], { count, ...context }) as Promise<
          MapToInstanceArrays<typeof classes>
        >,
      saveMany: (count: number, options: SeedSaveOptions) =>
        saveManySeed(
          classes as [...typeof classes],
          { count, ...options } as SeedSaveManyOptions,
        ) as Promise<MapToInstanceArrays<typeof classes>>,
    };
  }

  const EntityClass = classOrClasses as EntityConstructor<T>;

  return {
    create: async ({ values, ...context }: SeedCreateOptions<T> = {}) => {
      const instance = await createSeed(EntityClass, context);

      if (values) {
        Object.assign(instance, values);
      }

      return instance;
    },
    save: (options: SeedSaveOptions<T>) => saveSeed(EntityClass, options),
    createMany: async (count: number, { values, ...context }: SeedCreateOptions<T> = {}) => {
      const instances = await createManySeed(EntityClass, { count, ...context });

      if (values) {
        instances.forEach((e) => Object.assign(e, values));
      }

      return instances;
    },
    saveMany: (count: number, options: SeedSaveOptions<T>) =>
      saveManySeed(EntityClass, { count, ...options }),
  };
}
