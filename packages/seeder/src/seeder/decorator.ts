import { registerSeeder } from './registry.js';
import type { SeedContext } from '../seed/registry.js';

/**
 * Interface that seeder classes must implement.
 *
 * The optional `TContext` parameter lets ORM packages expose a narrowed version
 * whose `run` method receives the ORM-specific context (e.g. `dataSource`, `em`).
 * Defaults to the base {@link SeedContext}.
 */
export interface SeederInterface<TContext extends SeedContext = SeedContext> {
  run(context: TContext): Promise<unknown>;
}

/** Configuration options for the {@link Seeder} decorator. */
export interface SeederOptions<TContext extends SeedContext = SeedContext> {
  /**
   * Seeder classes that must complete before this one runs.
   * Resolved transitively — dependencies of dependencies are included automatically.
   * {@link runSeeders} topologically sorts the full set and detects circular dependencies.
   */
  dependencies?: (new () => SeederInterface<TContext>)[];
}

/** Marks a class as a seeder with no explicit dependency configuration. */
export function Seeder(): ClassDecorator;

/**
 * Marks a class as a seeder and registers dependency metadata.
 *
 * @example
 * @Seeder({ dependencies: [UserSeeder] })
 * class PostSeeder implements SeederInterface {
 *   async run(ctx: SeedContext) {
 *     await seed(Post).saveMany(50, ctx)
 *   }
 * }
 */
export function Seeder<TContext extends SeedContext = SeedContext>(
  options: SeederOptions<TContext>,
): ClassDecorator;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Seeder(options: SeederOptions<any> = {}): ClassDecorator {
  return (target) => {
    registerSeeder(target, { dependencies: options.dependencies ?? [] });
  };
}
