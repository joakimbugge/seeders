import type { EntityManager } from '@mikro-orm/core';
import { createMany } from './creator.js';
import type { SeedValues } from './creator.js';
import type {
  EntityConstructor,
  EntityInstance,
  MapToInstanceArrays,
  MapToInstances,
  SeedContext,
} from './registry.js';

export interface SaveOptions<T extends EntityInstance = EntityInstance> extends SeedContext {
  em: EntityManager;
  values?: SeedValues<T>;
}

export interface SaveManyOptions<T extends EntityInstance = EntityInstance> extends SaveOptions<T> {
  count: number;
}

export async function save<T extends EntityInstance>(
  EntityClass: EntityConstructor<T>,
  options: SaveOptions<T>,
): Promise<T>;
export async function save<T extends readonly EntityConstructor[]>(
  EntityClasses: [...T],
  options: SaveOptions,
): Promise<MapToInstances<T>>;
export async function save<T extends EntityInstance>(
  classOrClasses: EntityConstructor<T> | readonly EntityConstructor[],
  options: SaveOptions<T>,
): Promise<T | EntityInstance[]> {
  if (Array.isArray(classOrClasses)) {
    const effectiveOptions = { relations: false, ...options, count: 1 };

    return (await Promise.all(
      (classOrClasses as EntityConstructor[]).map((cls) =>
        saveBatch(cls, effectiveOptions).then(([entity]) => entity!),
      ),
    )) as EntityInstance[];
  }

  const [entity] = await saveBatch(classOrClasses as EntityConstructor<T>, {
    ...options,
    count: 1,
  });

  return entity!;
}

export async function saveMany<T extends EntityInstance>(
  EntityClass: EntityConstructor<T>,
  options: SaveManyOptions<T>,
): Promise<T[]>;
export async function saveMany<T extends readonly EntityConstructor[]>(
  EntityClasses: [...T],
  options: SaveManyOptions,
): Promise<MapToInstanceArrays<T>>;
export async function saveMany<T extends EntityInstance>(
  classOrClasses: EntityConstructor<T> | readonly EntityConstructor[],
  options: SaveManyOptions<T>,
): Promise<T[] | EntityInstance[][]> {
  if (Array.isArray(classOrClasses)) {
    const effectiveOptions = { relations: false, ...options };

    return (await Promise.all(
      (classOrClasses as EntityConstructor[]).map((cls) => saveBatch(cls, effectiveOptions)),
    )) as EntityInstance[][];
  }

  return await saveBatch(classOrClasses as EntityConstructor<T>, options);
}

async function saveBatch<T extends EntityInstance>(
  EntityClass: EntityConstructor<T>,
  options: SaveManyOptions<T>,
): Promise<T[]> {
  const { count, em } = options;

  if (count === 0) {
    return [];
  }

  const entities = await createMany(EntityClass, options);

  for (const entity of entities) {
    em.persist(entity);
  }

  await em.flush();

  return entities;
}
