/** An entity instance — any class-based object. */
export type EntityInstance = object;

/** A constructor that produces an entity instance. */
export type EntityConstructor<T extends EntityInstance = EntityInstance> = new () => T;

/** Options for the `@Seed` decorator. */
export interface SeedOptions {
  /**
   * Number of related entities to create. Only meaningful on one-to-many and
   * many-to-many relation properties. Ignored on scalar and single-entity relations.
   */
  count?: number;
}
