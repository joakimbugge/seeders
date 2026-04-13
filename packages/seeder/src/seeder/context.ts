import type { SeedContext } from '../seed/registry.js';

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
 *     const users = ctx.results?.get(UserSeeder) as User[]
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
   *     const users = ctx.results?.get(UserSeeder) as User[]
   *     return seed(Booking).createMany(10, {
   *       ...ctx,
   *       values: { user: () => faker.helpers.arrayElement(users) },
   *     })
   *   }
   * }
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results?: ReadonlyMap<Function, any>;
}
