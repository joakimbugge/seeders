import 'reflect-metadata';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Entity, PrimaryKey } from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import type { SeedContext } from '../../src';
import { runSeeders, Seeder } from '../../src';

// MikroORM requires at least one entity to initialize.
@Entity()
class Placeholder {
  @PrimaryKey()
  id!: number;
}

describe('logging', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Placeholder],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes logging through the MikroORM logger when logging is 'mikroorm'", async () => {
    const em = orm.em.fork();
    const loggerSpy = vi.spyOn(em.config.getLogger(), 'log');

    @Seeder()
    class MikroOrmLogSeeder {
      async run(_ctx: SeedContext) {}
    }

    await runSeeders([MikroOrmLogSeeder], { em, logging: 'mikroorm' });

    expect(loggerSpy).toHaveBeenCalledWith('info', expect.stringContaining('[MikroOrmLogSeeder]'));
    expect(loggerSpy).toHaveBeenCalledWith('info', expect.stringContaining('Starting'));
    expect(loggerSpy).toHaveBeenCalledWith('info', expect.stringContaining('Done'));
  });

  it("logs a failure at warn level through the MikroORM logger when logging is 'mikroorm'", async () => {
    const em = orm.em.fork();
    const warnSpy = vi.spyOn(em.config.getLogger(), 'warn');

    @Seeder()
    class MikroOrmWarnSeeder {
      async run(_ctx: SeedContext) {
        throw new Error('fail');
      }
    }

    await expect(runSeeders([MikroOrmWarnSeeder], { em, logging: 'mikroorm' })).rejects.toThrow();

    expect(warnSpy).toHaveBeenCalledWith('info', expect.stringContaining('[MikroOrmWarnSeeder]'));
  });

  it("calls the MikroORM logger when logging is 'mikroorm' even if MikroORM debug is disabled — suppression happens inside MikroORM", async () => {
    const em = orm.em.fork();
    const loggerSpy = vi.spyOn(em.config.getLogger(), 'log');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    em.config.getLogger().setDebugMode(false);

    @Seeder()
    class MikroOrmDisabledLogSeeder {
      async run(_ctx: SeedContext) {}
    }

    await runSeeders([MikroOrmDisabledLogSeeder], { em, logging: 'mikroorm' });

    expect(loggerSpy).toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("produces no output when logging is 'mikroorm' and no em is provided", async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Seeder()
    class MikroOrmNoEmSeeder {
      async run(_ctx: SeedContext) {}
    }

    await runSeeders([MikroOrmNoEmSeeder], { logging: 'mikroorm' });

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
