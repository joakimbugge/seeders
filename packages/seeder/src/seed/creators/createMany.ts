import type { MetadataAdapter } from '../adapter.js';
import type {
  EntityConstructor,
  EntityInstance,
  MapToInstanceArrays,
  SeedContext,
} from '../registry.js';
import type { SeedValues } from '../utils/createOne.js';
import { applyValues, createManyInstances } from '../utils/createOne.js';

/** Base options for the `createMany` overload. */
export interface CreateManyOptions<T extends EntityInstance = EntityInstance> extends SeedContext {
  count: number;
  values?: SeedValues<T>;
}

/**
 * Creates `count` in-memory instances for one entity class.
 * Applies optional `values` overrides per created instance.
 *
 * @internal The `adapter` parameter is supplied by ORM packages and is not part of the user-facing API.
 */
export async function createMany<T extends EntityInstance>(
  EntityClass: EntityConstructor<T>,
  options: CreateManyOptions<T>,
  adapter: MetadataAdapter,
): Promise<T[]>;

/**
 * Creates `count` instances for each class in the tuple.
 * Relation seeding defaults to `false` for this overload.
 *
 * @internal The `adapter` parameter is supplied by ORM packages and is not part of the user-facing API.
 */
export async function createMany<T extends EntityConstructor[]>(
  EntityClasses: [...T],
  options: CreateManyOptions,
  adapter: MetadataAdapter,
): Promise<MapToInstanceArrays<T>>;

export async function createMany<T extends EntityInstance>(
  ClassOrClasses: EntityConstructor<T> | EntityConstructor<T>[],
  options: CreateManyOptions<T>,
  adapter: MetadataAdapter,
): Promise<T[] | EntityInstance[][]> {
  if (Array.isArray(ClassOrClasses)) {
    return await Promise.all(
      ClassOrClasses.map((cls) => createManyInstances(cls, options, adapter)),
    );
  }

  const instances = await createManyInstances(ClassOrClasses, options, adapter);
  const { values } = options;

  if (values) {
    await Promise.all(instances.map((instance, i) => applyValues(instance, values, options, i)));
  }

  return instances;
}
