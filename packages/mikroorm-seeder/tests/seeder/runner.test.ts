import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import type { SeedContext } from '../../src';
import { runSeeders, seed, Seed, Seeder } from '../../src';

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

@Entity()
class SeedUser {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.person.fullName())
  @Property()
  name!: string;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('seeder suites', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [SeedUser],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
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

      const em = orm.em.fork();
      await runSeeders([ContextSeeder], { em });

      expect(received?.em).toBe(em);
    });

    it('actually seeds the database', async () => {
      @Seeder()
      class UserSeeder {
        async run(ctx: SeedContext) {
          await seed(SeedUser).saveMany(3, { ...ctx, em: ctx.em! });
        }
      }

      const em = orm.em.fork();
      const before = await orm.em.fork().count(SeedUser);
      await runSeeders([UserSeeder], { em });
      const after = await orm.em.fork().count(SeedUser);

      expect(after - before).toBe(3);
    });
  });
});
