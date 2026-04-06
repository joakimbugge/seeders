import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Column, DataSource, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { SeedContext } from '../../src';
import { runSeeders, seed, Seed, Seeder } from '../../src';

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

@Entity()
class SeedUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Seed(() => faker.person.fullName())
  @Column({ type: 'text' })
  name!: string;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('seeder suites', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: true,
      logging: false,
      entities: [SeedUser],
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('basic execution', () => {
    it('passes context to the seeder', async () => {
      let received: SeedContext | undefined;

      @Seeder()
      class ContextSeeder {
        async run(ctx: SeedContext) {
          received = ctx;
        }
      }

      await runSeeders([ContextSeeder], { dataSource });

      expect(received?.dataSource).toBe(dataSource);
    });

    it('actually seeds the database', async () => {
      @Seeder()
      class UserSeeder {
        async run(ctx: SeedContext) {
          await seed(SeedUser).saveMany(3, { ...ctx, dataSource: ctx.dataSource! });
        }
      }

      const before = await dataSource.getRepository(SeedUser).count();
      await runSeeders([UserSeeder], { dataSource });
      const after = await dataSource.getRepository(SeedUser).count();

      expect(after - before).toBe(3);
    });
  });
});
