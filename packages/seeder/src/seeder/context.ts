import type { SeedContext } from '../seed/registry.js';

/**
 * Typed result map — returned by {@link runSeeders} and available on `ctx.results` inside `run`.
 *
 * The `get` overload infers the return type from the seeder constructor, so no casting is needed:
 *
 * @example
 * const results = await runSeeders([UserSeeder, PostSeeder]);
 * const users = results.get(UserSeeder); // User[]
 * const posts = results.get(PostSeeder); // Post[]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SeederResultMap extends Omit<ReadonlyMap<Function, unknown>, 'get'> {
  get<TResult>(
    key: new (...args: any[]) => { run(...args: any[]): Promise<TResult> },
  ): TResult | undefined;
}

/**
 * Context passed to a seeder's `run` method by {@link runSeeders}.
 * Extends {@link SeedContext} with `results` — a live map of return values
 * from seeders that have already completed.
 *
 * Use this type (rather than {@link SeedContext}) when typing a seeder's `run`
 * parameter, so that `ctx.results` is available with type safety.
 *
 * @example
 * @Seeder({ dependencies: [UserSeeder] })
 * class BookingSeeder implements SeederInterface {
 *   async run(ctx: SeederRunContext) {
 *     const users = ctx.results?.get(UserSeeder) // User[]
 *   }
 * }
 */
export interface SeederRunContext extends SeedContext {
  /**
   * Return values of seeders that have already completed, keyed by seeder constructor.
   * Populated automatically by {@link runSeeders} and forwarded to every seeder's `run` method.
   *
   * When spreading `ctx` into {@link createMany} or {@link saveMany} options, `results` is also
   * available inside `@Seed` factory callbacks via the context argument.
   *
   * @example
   * @Seeder({ dependencies: [UserSeeder] })
   * class BookingSeeder implements SeederInterface {
   *   async run(ctx: SeederRunContext) {
   *     const users = ctx.results?.get(UserSeeder) // User[]
   *     return seed(Booking).createMany(10, {
   *       ...ctx,
   *       values: { user: () => faker.helpers.arrayElement(users) },
   *     })
   *   }
   * }
   */
  results?: SeederResultMap;
}
