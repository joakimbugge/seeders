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

export type SeedFactory<T = unknown, TEntity = any> = (
  context: SeedContext,
  self: TEntity,
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
