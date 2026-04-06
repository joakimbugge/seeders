import type { MetadataAdapter, PersistenceAdapter } from '../adapter.js';
import type { CreateManyOptions } from '../creators/createMany.js';
import { create } from '../creators/create.js';
import { createMany } from '../creators/createMany.js';
import { save } from '../persist/save.js';
import { saveMany } from '../persist/saveMany.js';
import type {
  EntityConstructor,
  MapToInstanceArrays,
  MapToInstances,
  SeedContext,
} from '../registry.js';

/**
 * Seed builder for multiple entity classes.
 * Returned by ORM `seed()` functions when passed an array.
 * Each method returns a tuple of instances in the same order as the input array.
 * Relation seeding is disabled by default; pass `relations: true` in the context to enable it.
 *
 * `TContext` is the ORM-specific context type that carries the connection required for
 * persistence (e.g. `{ dataSource: DataSource }` for TypeORM).
 */
export interface MultiSeed<
  T extends readonly EntityConstructor[],
  TContext extends SeedContext = SeedContext,
> {
  /** Creates one instance of each class in memory without persisting. */
  create(context?: SeedContext): Promise<MapToInstances<T>>;
  /** Creates `count` instances of each class in memory without persisting. */
  createMany(count: number, context?: SeedContext): Promise<MapToInstanceArrays<T>>;
  /** Creates and persists one instance of each class. */
  save(options: TContext): Promise<MapToInstances<T>>;
  /** Creates and persists `count` instances of each class. */
  saveMany(count: number, options: TContext): Promise<MapToInstanceArrays<T>>;
}

/**
 * Returns a create-only {@link MultiSeed} builder bound to the given entity classes.
 * Use this overload when you only need in-memory creation and will handle persistence yourself.
 */
export function makeMultiSeedBuilder<T extends readonly EntityConstructor[]>(
  classes: [...T],
  metadataAdapter: MetadataAdapter,
): Pick<MultiSeed<T>, 'create' | 'createMany'>;
/**
 * Returns a full {@link MultiSeed} builder bound to the given entity classes and adapters.
 * ORM packages call this with their own adapters to produce the multi-class `seed()` return value.
 */
export function makeMultiSeedBuilder<
  T extends readonly EntityConstructor[],
  TContext extends SeedContext,
>(
  classes: [...T],
  metadataAdapter: MetadataAdapter,
  persistenceAdapter: PersistenceAdapter<TContext>,
): MultiSeed<T, TContext>;
export function makeMultiSeedBuilder<
  T extends readonly EntityConstructor[],
  TContext extends SeedContext,
>(
  classes: [...T],
  metadataAdapter: MetadataAdapter,
  persistenceAdapter?: PersistenceAdapter<TContext>,
): Pick<MultiSeed<T>, 'create' | 'createMany'> | MultiSeed<T, TContext> {
  const base = {
    create: (context?: SeedContext) =>
      create(classes, context, metadataAdapter) as Promise<MapToInstances<T>>,
    createMany: (count: number, context?: SeedContext) =>
      createMany(classes, { count, ...context } as CreateManyOptions, metadataAdapter) as Promise<
        MapToInstanceArrays<T>
      >,
  };

  if (!persistenceAdapter) {
    return base;
  }

  return {
    ...base,
    save: (options: TContext) =>
      save(classes, options, metadataAdapter, persistenceAdapter) as Promise<MapToInstances<T>>,
    saveMany: (count: number, options: TContext) =>
      saveMany(
        classes,
        { count, ...options } as TContext & { count: number },
        metadataAdapter,
        persistenceAdapter,
      ) as Promise<MapToInstanceArrays<T>>,
  };
}
