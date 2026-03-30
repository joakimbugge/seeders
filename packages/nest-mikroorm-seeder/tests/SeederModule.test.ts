import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { ConsoleLogger, Injectable, Module, type ModuleMetadata } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import {
  Seed,
  seed,
  type SeedContext,
  Seeder,
  type SeederInterface,
} from '@joakimbugge/mikroorm-seeder';
import { faker } from '@faker-js/faker';
import { SeederModule } from '../src';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.person.fullName())
  @Property()
  name!: string;
}

@Seeder()
class UserSeeder implements SeederInterface {
  async run({ em }: SeedContext): Promise<void> {
    await seed(User).save({ em: em! });
  }
}

async function compileModule(metadata: ModuleMetadata): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule(metadata).compile();
  moduleRef.useLogger(new ConsoleLogger());
  return moduleRef;
}

async function createOrm(): Promise<MikroORM> {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.create();
  return orm;
}

describe('SeederModule', () => {
  describe('forRoot', () => {
    it('runs seeders with an explicit em', async () => {
      const orm = await createOrm();

      const moduleRef = await compileModule({
        imports: [SeederModule.forRoot({ seeders: [UserSeeder], em: orm.em.fork() })],
      });

      await moduleRef.init();

      expect(await orm.em.fork().count(User)).toBe(1);

      await moduleRef.close();
      await orm.close();
    });

    it('auto-detects MikroORM from the module graph', async () => {
      const orm = await createOrm();

      @Module({
        providers: [{ provide: MikroORM, useValue: orm }],
        exports: [MikroORM],
      })
      class DatabaseModule {}

      const moduleRef = await compileModule({
        imports: [DatabaseModule, SeederModule.forRoot({ seeders: [UserSeeder] })],
      });

      await moduleRef.init();

      expect(await orm.em.fork().count(User)).toBe(1);

      await moduleRef.close();
      await orm.close();
    });

    it('throws when no MikroORM is available', async () => {
      const moduleRef = await compileModule({
        imports: [SeederModule.forRoot({ seeders: [UserSeeder] })],
      });

      await expect(moduleRef.init()).rejects.toThrow(
        'SeederModule could not resolve a MikroORM instance',
      );
    });
  });

  describe('logging', () => {
    it('still runs seeders when logging is false', async () => {
      const orm = await createOrm();

      const moduleRef = await compileModule({
        imports: [
          SeederModule.forRoot({ seeders: [UserSeeder], em: orm.em.fork(), logging: false }),
        ],
      });

      await moduleRef.init();

      expect(await orm.em.fork().count(User)).toBe(1);

      await moduleRef.close();
      await orm.close();
    });
  });

  describe('enabled', () => {
    it('skips seeding when enabled is false', async () => {
      const orm = await createOrm();

      const moduleRef = await compileModule({
        imports: [
          SeederModule.forRoot({ seeders: [UserSeeder], em: orm.em.fork(), enabled: false }),
        ],
      });

      await moduleRef.init();

      expect(await orm.em.fork().count(User)).toBe(0);

      await moduleRef.close();
      await orm.close();
    });
  });

  describe('runOnce', () => {
    async function bootstrap(orm: MikroORM, options?: object): Promise<void> {
      const moduleRef = await compileModule({
        imports: [SeederModule.forRoot({ seeders: [UserSeeder], em: orm.em.fork(), ...options })],
      });
      await moduleRef.init();
      await moduleRef.close();
    }

    it('does not re-run seeders on a second bootstrap by default', async () => {
      const orm = await createOrm();

      await bootstrap(orm);
      await bootstrap(orm);

      expect(await orm.em.fork().count(User)).toBe(1);

      await orm.close();
    });

    it('re-runs seeders on each bootstrap when runOnce is false', async () => {
      const orm = await createOrm();

      await bootstrap(orm, { runOnce: false });
      await bootstrap(orm, { runOnce: false });

      expect(await orm.em.fork().count(User)).toBe(2);

      await orm.close();
    });

    it('records each seeder in the history table after it runs', async () => {
      const orm = await createOrm();

      await bootstrap(orm);

      const rows = (await orm.em
        .fork()
        .getConnection()
        .execute('SELECT name FROM "seeders"', [], 'all')) as { name: string }[];

      expect(rows.map((r) => r.name)).toContain('UserSeeder');

      await orm.close();
    });

    it('uses a custom history table name', async () => {
      const orm = await createOrm();

      await bootstrap(orm, { historyTableName: 'custom_seed_history' });

      const rows = (await orm.em
        .fork()
        .getConnection()
        .execute('SELECT name FROM "custom_seed_history"', [], 'all')) as { name: string }[];

      expect(rows.map((r) => r.name)).toContain('UserSeeder');

      await orm.close();
    });
  });

  describe('hooks', () => {
    it('calls onBefore before each seeder', async () => {
      const orm = await createOrm();
      const onBefore = vi.fn();

      const moduleRef = await compileModule({
        imports: [SeederModule.forRoot({ seeders: [UserSeeder], em: orm.em.fork(), onBefore })],
      });

      await moduleRef.init();

      expect(onBefore).toHaveBeenCalledWith(UserSeeder);

      await moduleRef.close();
      await orm.close();
    });

    it('calls onAfter after each seeder', async () => {
      const orm = await createOrm();
      const onAfter = vi.fn();

      const moduleRef = await compileModule({
        imports: [SeederModule.forRoot({ seeders: [UserSeeder], em: orm.em.fork(), onAfter })],
      });

      await moduleRef.init();

      expect(onAfter).toHaveBeenCalledWith(UserSeeder, expect.any(Number));

      await moduleRef.close();
      await orm.close();
    });
  });

  describe('forFeature', () => {
    it('runs seeders using bare SeederModule with MikroORM from the module graph', async () => {
      const orm = await createOrm();

      @Module({
        providers: [{ provide: MikroORM, useValue: orm }],
        exports: [MikroORM],
      })
      class DatabaseModule {}

      @Module({ imports: [SeederModule.forFeature([UserSeeder])] })
      class UserModule {}

      const moduleRef = await compileModule({
        imports: [DatabaseModule, SeederModule, UserModule],
      });

      await moduleRef.init();

      expect(await orm.em.fork().count(User)).toBe(1);

      await moduleRef.close();
      await orm.close();
    });

    it('runs seeders registered in a feature module', async () => {
      const orm = await createOrm();

      @Module({ imports: [SeederModule.forFeature([UserSeeder])] })
      class UserModule {}

      const moduleRef = await compileModule({
        imports: [SeederModule.forRoot({ em: orm.em.fork() }), UserModule],
      });

      await moduleRef.init();

      expect(await orm.em.fork().count(User)).toBe(1);

      await moduleRef.close();
      await orm.close();
    });

    it('runs seeders from root and feature modules together', async () => {
      const orm = await createOrm();

      @Seeder()
      class ExtraUserSeeder implements SeederInterface {
        async run({ em }: SeedContext): Promise<void> {
          await seed(User).save({ em: em! });
        }
      }

      @Module({ imports: [SeederModule.forFeature([ExtraUserSeeder])] })
      class ExtraModule {}

      const moduleRef = await compileModule({
        imports: [SeederModule.forRoot({ seeders: [UserSeeder], em: orm.em.fork() }), ExtraModule],
      });

      await moduleRef.init();

      expect(await orm.em.fork().count(User)).toBe(2);

      await moduleRef.close();
      await orm.close();
    });

    it('resolves cross-module dependencies in the correct order', async () => {
      const orm = await createOrm();
      const order: string[] = [];

      @Seeder()
      class FirstSeeder implements SeederInterface {
        async run(): Promise<void> {
          order.push('first');
        }
      }

      @Seeder({ dependencies: [FirstSeeder] })
      class SecondSeeder implements SeederInterface {
        async run(): Promise<void> {
          order.push('second');
        }
      }

      @Module({ imports: [SeederModule.forFeature([SecondSeeder])] })
      class FeatureModule {}

      const moduleRef = await compileModule({
        imports: [
          SeederModule.forRoot({ seeders: [FirstSeeder], em: orm.em.fork() }),
          FeatureModule,
        ],
      });

      await moduleRef.init();

      expect(order).toEqual(['first', 'second']);

      await moduleRef.close();
      await orm.close();
    });
  });

  describe('run', () => {
    it('executes the callback with the em', async () => {
      const orm = await createOrm();
      const run = vi.fn();

      const moduleRef = await compileModule({
        imports: [SeederModule.forRoot({ run, em: orm.em.fork() })],
      });

      await moduleRef.init();

      expect(run).toHaveBeenCalledWith({ em: expect.anything() });

      await moduleRef.close();
      await orm.close();
    });

    it('always executes on every boot', async () => {
      const orm = await createOrm();
      const run = vi.fn();

      async function bootstrap(): Promise<void> {
        const moduleRef = await compileModule({
          imports: [SeederModule.forRoot({ run, em: orm.em.fork() })],
        });
        await moduleRef.init();
        await moduleRef.close();
      }

      await bootstrap();
      await bootstrap();

      expect(run).toHaveBeenCalledTimes(2);

      await orm.close();
    });

    it('executes after seeders when both are provided', async () => {
      const orm = await createOrm();
      const order: string[] = [];

      @Seeder()
      class OrderSeeder implements SeederInterface {
        async run(): Promise<void> {
          order.push('seeder');
        }
      }

      const moduleRef = await compileModule({
        imports: [
          SeederModule.forRoot({
            seeders: [OrderSeeder],
            run: async () => {
              order.push('run');
            },
            em: orm.em.fork(),
          }),
        ],
      });

      await moduleRef.init();

      expect(order).toEqual(['seeder', 'run']);

      await moduleRef.close();
      await orm.close();
    });
  });

  describe('forRootAsync', () => {
    it('runs seeders using an em resolved from a factory', async () => {
      const orm = await createOrm();

      @Injectable()
      class DatabaseService {
        readonly orm = orm;
      }

      @Module({ providers: [DatabaseService], exports: [DatabaseService] })
      class DatabaseModule {}

      const moduleRef = await compileModule({
        imports: [
          SeederModule.forRootAsync({
            imports: [DatabaseModule],
            inject: [DatabaseService],
            useFactory: (db: DatabaseService) => ({
              seeders: [UserSeeder],
              em: db.orm.em.fork(),
            }),
          }),
        ],
      });

      await moduleRef.init();

      expect(await orm.em.fork().count(User)).toBe(1);

      await moduleRef.close();
      await orm.close();
    });
  });
});
