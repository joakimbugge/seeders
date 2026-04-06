import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SeederLogger, SeedContext } from '../../src';
import { runSeeders, Seeder, ConsoleLogger } from '../../src';

describe('logging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('produces no output by default', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Seeder()
    class LogDefaultSeeder {
      async run(_ctx: SeedContext) {}
    }

    await runSeeders([LogDefaultSeeder], {});

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('logs a start and done message via console when logging is true', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    @Seeder()
    class LogTrueSeeder {
      async run(_ctx: SeedContext) {}
    }

    await runSeeders([LogTrueSeeder], { logging: true });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[LogTrueSeeder]'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Starting'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Done'));
  });

  it('logs a failure message via console.warn when logging is true and a seeder throws', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    @Seeder()
    class LogErrorSeeder {
      async run(_ctx: SeedContext) {
        throw new Error('oops');
      }
    }

    await expect(runSeeders([LogErrorSeeder], { logging: true })).rejects.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[LogErrorSeeder]'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed'));
  });

  it('uses a custom logger when logging is true and logger is provided', async () => {
    const custom: SeederLogger = {
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    @Seeder()
    class CustomLogSeeder {
      async run(_ctx: SeedContext) {}
    }

    await runSeeders([CustomLogSeeder], { logging: true, logger: custom });

    expect(custom.log).toHaveBeenCalledWith(expect.stringContaining('[CustomLogSeeder]'));
    expect(custom.log).toHaveBeenCalledWith(expect.stringContaining('Starting'));
    expect(custom.log).toHaveBeenCalledWith(expect.stringContaining('Done'));
  });

  it('suppresses all console output when logging is false', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Seeder()
    class SilentSeeder {
      async run(_ctx: SeedContext) {}
    }

    await runSeeders([SilentSeeder], { logging: false });

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('suppresses the failure message when logging is false', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Seeder()
    class SilentErrorSeeder {
      async run(_ctx: SeedContext) {
        throw new Error('silent');
      }
    }

    await expect(runSeeders([SilentErrorSeeder], { logging: false })).rejects.toThrow();

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('ConsoleLogger', () => {
  it('delegates each method to the corresponding console method', () => {
    const logger = new ConsoleLogger();

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.log('log');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    logger.debug('debug');

    expect(logSpy).toHaveBeenCalledWith('log');
    expect(infoSpy).toHaveBeenCalledWith('info');
    expect(warnSpy).toHaveBeenCalledWith('warn');
    expect(errorSpy).toHaveBeenCalledWith('error');
    expect(debugSpy).toHaveBeenCalledWith('debug');

    vi.restoreAllMocks();
  });
});
