import type { BaseMultiSeed, BaseSingleSeed } from '@joakimbugge/seeder';
import { makeMultiSeedBuilder, makeSeedBuilder } from '@joakimbugge/seeder';
import type { EntityConstructor, EntityInstance } from '../types.js';
import { PersistContext, persistenceAdapter } from '../adapters/persistenceAdapter';
import { metadataAdapter } from '../adapters/metadataAdapter';

/**
 * Seed builder for a single entity class. Returned by {@link seed} when passed one class.
 * Narrows `TContext` to {@link PersistContext}, requiring `em` for persistence.
 */
export type SingleSeed<T extends EntityInstance> = BaseSingleSeed<T, PersistContext>;

/**
 * Seed builder for multiple entity classes. Returned by {@link seed} when passed an array.
 * Each method returns a tuple of instances in the same order as the input array.
 * Relation seeding is disabled by default; pass `relations: true` in the context to enable it.
 */
export type MultiSeed<T extends EntityConstructor[]> = BaseMultiSeed<T, PersistContext>;

/**
 * Returns a {@link SingleSeed} builder for the given entity class.
 *
 * @example
 * // Create one Director in memory (no DB)
 * const director = await seed(Director).create()
 *
 * @example
 * // Persist one Director with all its seeded relations
 * const director = await seed(Director).save({ em })
 *
 * @example
 * // Persist 10 Directors
 * const directors = await seed(Director).saveMany(10, { em })
 */
export function seed<T extends EntityInstance>(EntityClass: EntityConstructor<T>): SingleSeed<T>;

/**
 * Returns a {@link MultiSeed} builder for the given entity classes.
 * Relation seeding is disabled by default; pass `relations: true` in the context to enable it.
 *
 * @example
 * // Create multiple entity classes at once (relations disabled by default)
 * const [user, post] = await seed([User, Post]).create()
 */
export function seed<T extends EntityConstructor[]>(EntityClasses: [...T]): MultiSeed<T>;

export function seed<T extends EntityInstance>(
  classOrClasses: EntityConstructor<T> | EntityConstructor[],
): SingleSeed<T> | MultiSeed<EntityConstructor[]> {
  return Array.isArray(classOrClasses)
    ? makeMultiSeedBuilder(classOrClasses, metadataAdapter, persistenceAdapter)
    : makeSeedBuilder(classOrClasses, metadataAdapter, persistenceAdapter);
}
