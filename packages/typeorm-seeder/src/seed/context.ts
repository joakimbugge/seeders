import type { DataSource } from 'typeorm';
import type { BaseSeedContext, BaseSeederRunContext } from '@joakimbugge/seeder';

/** Context passed through a seed operation. Available inside factory callbacks and `SeederInterface.run`. */
export type SeedContext = BaseSeedContext & {
  /**
   * The TypeORM DataSource. Automatically set by `save`/`saveMany` calls.
   * Also available in factory callbacks — useful for looking up existing
   * entities instead of creating new ones:
   *
   * @example
   * @Seed(async ({ dataSource }) => dataSource.getRepository(Role).findOneByOrFail({ name: 'admin' }))
   * role!: Role
   */
  dataSource?: DataSource;
};

/**
 * Context passed to a seeder's `run` method by {@link runSeeders}.
 * Combines {@link SeedContext} (with `dataSource`) and `results` from previously completed seeders.
 *
 * Use this type when typing a seeder's `run` parameter for full type safety.
 *
 * @example
 * @Seeder({ dependencies: [UserSeeder] })
 * class PostSeeder implements SeederInterface {
 *   async run(ctx: SeederRunContext) {
 *     const users = ctx.results?.get(UserSeeder) as User[]
 *     await seed(Post).saveMany(50, { ...ctx, values: { author: () => faker.helpers.arrayElement(users) } })
 *   }
 * }
 */
export type SeederRunContext = SeedContext & Pick<BaseSeederRunContext, 'results'>;
