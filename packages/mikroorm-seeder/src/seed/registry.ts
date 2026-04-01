import type { EntityManager } from '@mikro-orm/core';

/** An entity instance — any class-based object managed by MikroORM. */
export type EntityInstance = object;

/** A constructor that produces an entity instance. */
export type EntityConstructor<T extends EntityInstance = EntityInstance> = new () => T;

/** Context passed through a seed operation. Available inside factory callbacks and `SeederInterface.run`. */
export interface SeedContext {
  /**
   * The MikroORM EntityManager. Automatically set by `save`/`saveMany` calls.
   * Also available in factory callbacks — useful for looking up existing entities.
   */
  em?: EntityManager;
  /**
   * Set to `false` to skip automatic relation seeding.
   * @default true
   */
  relations?: boolean;
}

/**
 * Factory callback passed to `@Seed`. Receives the seed context, the partially built entity,
 * and a zero-based index that counts up across a `createMany`/`saveMany` batch.
 *
 * Properties are seeded sequentially in declaration order, so any property declared above the
 * current one is already set on `self` and can be read to derive the current value.
 *
 * @example
 * @Seed((_, __, i) => `user-${i}@example.com`)
 * email!: string
 */
export type SeedFactory<T = unknown, TEntity = any> = (
  context: SeedContext,
  self: TEntity,
  index: number,
) => T | Promise<T>;

export interface SeedOptions {
  count?: number;
}

export interface SeedEntry {
  propertyKey: string | symbol;
  factory: SeedFactory | undefined;
  options: SeedOptions;
}

export type MapToInstances<T extends readonly EntityConstructor[]> = {
  [K in keyof T]: T[K] extends EntityConstructor<infer I> ? I : never;
};

export type MapToInstanceArrays<T extends readonly EntityConstructor[]> = {
  [K in keyof T]: T[K] extends EntityConstructor<infer I> ? I[] : never;
};

const registry = new Map<Function, SeedEntry[]>();

export function registerSeed(target: Function, entry: SeedEntry): void {
  const entries = registry.get(target) ?? [];
  entries.push(entry);
  registry.set(target, entries);
}

export function getSeeds(target: Function): SeedEntry[] {
  const entries: SeedEntry[] = [];
  let current: Function = target;

  while (current && current !== Function.prototype) {
    const own = registry.get(current);
    if (own) {
      entries.unshift(...own);
    }
    current = Object.getPrototypeOf(current) as Function;
  }

  return entries;
}
