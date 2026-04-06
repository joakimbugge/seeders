import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { DataSource } from 'typeorm';
import type { SeedContext } from '../../src';
import { runSeeders, Seeder } from '../../src';

describe('logging', () => {
  // dataSource has TypeORM logging disabled — used to verify that
  // logging: 'typeorm' still calls the TypeORM logger even when suppressed.
  let dataSource: DataSource;

  // loggingSource has TypeORM logging enabled — used to verify routing.
  let loggingSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: true,
      logging: false,
      entities: [],
    });

    loggingSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: true,
      logging: ['log', 'warn'],
      entities: [],
    });

    await dataSource.initialize();
    await loggingSource.initialize();
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }

    if (loggingSource.isInitialized) {
      await loggingSource.destroy();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes logging through the TypeORM logger when logging is 'typeorm'", async () => {
    const loggerSpy = vi.spyOn(loggingSource.logger, 'log');

    @Seeder()
    class TypeOrmLogSeeder {
      async run(_ctx: SeedContext) {}
    }

    await runSeeders([TypeOrmLogSeeder], { dataSource: loggingSource, logging: 'typeorm' });

    expect(loggerSpy).toHaveBeenCalledWith('log', expect.stringContaining('[TypeOrmLogSeeder]'));
    expect(loggerSpy).toHaveBeenCalledWith('log', expect.stringContaining('Starting'));
    expect(loggerSpy).toHaveBeenCalledWith('log', expect.stringContaining('Done'));
  });

  it("logs a failure at warn level through the TypeORM logger when logging is 'typeorm'", async () => {
    const loggerSpy = vi.spyOn(loggingSource.logger, 'log');

    @Seeder()
    class TypeOrmWarnSeeder {
      async run(_ctx: SeedContext) {
        throw new Error('fail');
      }
    }

    await expect(
      runSeeders([TypeOrmWarnSeeder], { dataSource: loggingSource, logging: 'typeorm' }),
    ).rejects.toThrow();

    expect(loggerSpy).toHaveBeenCalledWith('warn', expect.stringContaining('[TypeOrmWarnSeeder]'));
  });

  it('does not call the TypeORM logger when logging is false', async () => {
    const loggerSpy = vi.spyOn(loggingSource.logger, 'log');

    @Seeder()
    class TypeOrmSilentSeeder {
      async run(_ctx: SeedContext) {}
    }

    await runSeeders([TypeOrmSilentSeeder], { dataSource: loggingSource, logging: false });

    expect(loggerSpy).not.toHaveBeenCalled();
  });

  it("calls the TypeORM logger when logging is 'typeorm' even if TypeORM logging is disabled — suppression happens inside TypeORM", async () => {
    const loggerSpy = vi.spyOn(dataSource.logger, 'log');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    @Seeder()
    class TypeOrmDisabledLogSeeder {
      async run(_ctx: SeedContext) {}
    }

    await runSeeders([TypeOrmDisabledLogSeeder], { dataSource, logging: 'typeorm' });

    expect(loggerSpy).toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("produces no output when logging is 'typeorm' and no dataSource is provided", async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Seeder()
    class TypeOrmNoSourceSeeder {
      async run(_ctx: SeedContext) {}
    }

    await runSeeders([TypeOrmNoSourceSeeder], { logging: 'typeorm' });

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
