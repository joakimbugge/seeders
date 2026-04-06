import type { MetadataAdapter } from '../adapter.js';
import type {
  EntityConstructor,
  EntityInstance,
  MapToInstances,
  SeedContext,
} from '../registry.js';
import { applyValues, createOne } from '../utils/createOne.js';
import type { SeedValues } from '../utils/createOne.js';

/** Base options for the single-class `create` overload. */
export interface CreateOptions<T extends EntityInstance> extends SeedContext {
  values?: SeedValues<T>;
}

/**
 * Creates one entity instance in memory for a single class.
 * Applies `values` overrides after factory/decorator seeding.
 *
 * @internal The `adapter` parameter is supplied by ORM packages and is not part of the user-facing API.
 */
export async function create<T extends EntityInstance>(
  EntityClass: EntityConstructor<T>,
  options: CreateOptions<T> | undefined,
  adapter: MetadataAdapter,
): Promise<T>;

/**
 * Creates one in-memory instance per class in the provided tuple.
 * Relation seeding defaults to `false` for this overload.
 *
 * @internal The `adapter` parameter is supplied by ORM packages and is not part of the user-facing API.
 */
export async function create<T extends EntityConstructor[]>(
  EntityClasses: [...T],
  context: SeedContext | undefined,
  adapter: MetadataAdapter,
): Promise<MapToInstances<T>>;

export async function create<T extends EntityInstance>(
  ClassOrClasses: EntityConstructor<T> | EntityConstructor[],
  options: CreateOptions<T> | undefined,
  adapter: MetadataAdapter,
): Promise<T | EntityInstance[]> {
  if (Array.isArray(ClassOrClasses)) {
    return await Promise.all(
      ClassOrClasses.map((cls) => createOne(cls, { relations: false, ...options }, 0, adapter)),
    );
  }

  const context = options ?? {};
  const instance = await createOne(ClassOrClasses, context, 0, adapter);

  if (context.values) {
    await applyValues(instance, context.values, context, 0);
  }

  return instance;
}

export type { SeedValues } from '../utils/createOne.js';
