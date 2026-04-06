import type { EntityInstance, SeedContext, SeedFactory, SeedOptions } from './registry.js';
import { EntityConstructor, registerSeed } from './registry.js';

/**
 * Marks a relation property for auto-seeding.
 *
 * The related entity class is inferred from ORM metadata. One instance is created
 * and recursively seeded (including its own `@Seed` properties).
 *
 * Circular back-references are broken automatically: if the related class is already
 * being seeded higher up in the same call chain, the property is left `undefined`.
 */
export function Seed(): PropertyDecorator;

/**
 * Marks a relation property for auto-seeding with options.
 *
 * Use `count` on one-to-many and many-to-many properties to control how many
 * related entities are created. Ignored for one-to-one and many-to-one.
 *
 * @example
 * @Seed({ count: 3 })
 * books!: Book[]
 */
export function Seed(options: SeedOptions): PropertyDecorator;

/**
 * Marks a property with a factory callback.
 *
 * The factory receives the current seed context and can return any value,
 * including a `Promise`. Use this for scalar properties or when you need full
 * control over how a related entity is resolved.
 *
 * @example
 * @Seed(() => faker.internet.email())
 * email!: string
 */
export function Seed<
  TEntity extends EntityInstance = EntityInstance,
  TContext extends SeedContext = SeedContext,
>(factory: SeedFactory<unknown, TEntity, TContext>): PropertyDecorator;

/** Marks a property with a factory callback and additional options. */
export function Seed<
  TEntity extends EntityInstance = EntityInstance,
  TContext extends SeedContext = SeedContext,
>(factory: SeedFactory<unknown, TEntity, TContext>, options: SeedOptions): PropertyDecorator;

export function Seed(
  factoryOrOptions?: SeedFactory<unknown, EntityInstance, SeedContext> | SeedOptions,
  options?: SeedOptions,
): PropertyDecorator {
  const factory = typeof factoryOrOptions === 'function' ? factoryOrOptions : undefined;
  const opts: SeedOptions =
    (typeof factoryOrOptions === 'object' ? factoryOrOptions : options) ?? {};

  return (target, propertyKey) => {
    registerSeed(target.constructor as EntityConstructor, { propertyKey, factory, options: opts });
  };
}
