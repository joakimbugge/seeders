import type { MetadataAdapter, PersistenceAdapter } from '../adapter.js';
import type { CreateOptions, SeedValues } from '../creators/create.js';
import { create } from '../creators/create.js';
import { createMany } from '../creators/createMany.js';
import { save } from '../persist/save.js';
import { saveMany } from '../persist/saveMany.js';
import type { EntityConstructor, EntityInstance, SeedContext } from '../registry.js';

/**
 * Seed builder for a single entity class.
 * Returned by ORM `seed()` functions when passed one class.
 *
 * `TContext` is the ORM-specific context type that carries the connection required for
 * persistence (e.g. `{ dataSource: DataSource }` for TypeORM).
 */
export interface SingleSeed<T extends EntityInstance, TContext extends SeedContext = SeedContext> {
  /** Creates a single instance in memory without persisting. */
  create(options?: CreateOptions<T>): Promise<T>;
  /** Creates multiple instances in memory without persisting. */
  createMany(count: number, options?: CreateOptions<T>): Promise<T[]>;
  /** Creates and persists a single instance. */
  save(options: TContext & { values?: SeedValues<T> }): Promise<T>;
  /** Creates and persists multiple instances. */
  saveMany(count: number, options: TContext & { values?: SeedValues<T> }): Promise<T[]>;
}

/**
 * Returns a create-only {@link SingleSeed} builder bound to the given entity class.
 * Use this overload when you only need in-memory creation and will handle persistence yourself.
 */
export function makeSeedBuilder<T extends EntityInstance>(
  EntityClass: EntityConstructor<T>,
  metadataAdapter: MetadataAdapter,
): Pick<SingleSeed<T>, 'create' | 'createMany'>;
/**
 * Returns a full {@link SingleSeed} builder bound to the given entity class and adapters.
 * ORM packages call this with their own adapters to produce the `seed()` return value.
 */
export function makeSeedBuilder<T extends EntityInstance, TContext extends SeedContext>(
  EntityClass: EntityConstructor<T>,
  metadataAdapter: MetadataAdapter,
  persistenceAdapter: PersistenceAdapter<TContext>,
): SingleSeed<T, TContext>;
export function makeSeedBuilder<T extends EntityInstance, TContext extends SeedContext>(
  EntityClass: EntityConstructor<T>,
  metadataAdapter: MetadataAdapter,
  persistenceAdapter?: PersistenceAdapter<TContext>,
): Pick<SingleSeed<T>, 'create' | 'createMany'> | SingleSeed<T, TContext> {
  const base = {
    create: (options?: CreateOptions<T>) => create(EntityClass, options, metadataAdapter),
    createMany: (count: number, options?: CreateOptions<T>) =>
      createMany(EntityClass, { count, ...options }, metadataAdapter),
  };

  if (!persistenceAdapter) {
    return base;
  }

  return {
    ...base,
    save: (options: TContext & { values?: SeedValues<T> }) =>
      save(EntityClass, options, metadataAdapter, persistenceAdapter),
    saveMany: (count: number, options: TContext & { values?: SeedValues<T> }) =>
      saveMany(
        EntityClass,
        { count, ...options } as TContext & { count: number; values?: SeedValues<T> },
        metadataAdapter,
        persistenceAdapter,
      ),
  };
}
