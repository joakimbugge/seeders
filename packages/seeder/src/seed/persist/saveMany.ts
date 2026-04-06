import type { MetadataAdapter, PersistenceAdapter } from '../adapter.js';
import type { SeedValues } from '../creators/create.js';
import type {
  EntityConstructor,
  EntityInstance,
  MapToInstanceArrays,
  SeedContext,
} from '../registry.js';
import { saveBatch } from '../utils/saveBatch.js';

/**
 * Creates and persists `count` instances for one entity class.
 *
 * @internal The `metadataAdapter` and `persistenceAdapter` parameters are supplied by ORM packages
 * and are not part of the user-facing API.
 */
export async function saveMany<T extends EntityInstance, TContext extends SeedContext>(
  EntityClass: EntityConstructor<T>,
  options: TContext & { count: number; values?: SeedValues<T> },
  metadataAdapter: MetadataAdapter,
  persistenceAdapter: PersistenceAdapter<TContext>,
): Promise<T[]>;

/**
 * Creates and persists `count` instances per class in the tuple.
 * Relation seeding defaults to `false` for this overload.
 *
 * @internal The `metadataAdapter` and `persistenceAdapter` parameters are supplied by ORM packages
 * and are not part of the user-facing API.
 */
export async function saveMany<T extends EntityConstructor[], TContext extends SeedContext>(
  EntityClasses: [...T],
  options: TContext & { count: number },
  metadataAdapter: MetadataAdapter,
  persistenceAdapter: PersistenceAdapter<TContext>,
): Promise<MapToInstanceArrays<T>>;

export async function saveMany<T extends EntityInstance, TContext extends SeedContext>(
  classOrClasses: EntityConstructor<T> | EntityConstructor[],
  options: TContext & { count: number; values?: SeedValues<T> },
  metadataAdapter: MetadataAdapter,
  persistenceAdapter: PersistenceAdapter<TContext>,
): Promise<T[] | EntityInstance[][]> {
  if (Array.isArray(classOrClasses)) {
    return await Promise.all(
      classOrClasses.map((cls) =>
        saveBatch(cls, { relations: false, ...options }, metadataAdapter, persistenceAdapter),
      ),
    );
  }

  return saveBatch(classOrClasses, options, metadataAdapter, persistenceAdapter);
}
