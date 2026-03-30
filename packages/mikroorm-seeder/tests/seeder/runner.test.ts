import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import type { SeedContext } from '../../src';
import { runSeeders, saveMany, Seed, Seeder } from '../../src';
import type { SeederLogger } from '../../src';
import { registerSeeder } from '../../src/seeder/registry.js';
import type { SeederCtor } from '../../src/seeder/runner.js';

@Entity()
class SeedUser {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.person.fullName())
  @Property()
  name!: string;
}

@Entity()
class SeedPost {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.lorem.sentence())
  @Property()
  title!: string;
}

@Entity()
class SeedComment {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.lorem.words(5))
  @Property()
  body!: string;
}

describe('seeder suites', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [SeedUser, SeedPost, SeedComment],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
  });

  describe('skip', () => {
    it('does not run a seeder when skip returns true', async () => {
      const spy = vi.fn();

      @Seeder()
      class SkippedSeeder {
        async run(_ctx: SeedContext) {
          spy();
        }
      }

      await runSeeders([SkippedSeeder], { logging: false, skip: () => true });

      expect(spy).not.toHaveBeenCalled();
    });

    it('runs a seeder when skip returns false', async () => {
      const spy = vi.fn();

      @Seeder()
      class NotSkippedSeeder {
        async run(_ctx: SeedContext) {
          spy();
        }
      }

      await runSeeders([NotSkippedSeeder], { logging: false, skip: () => false });

      expect(spy).toHaveBeenCalledOnce();
    });

    it('receives the seeder constructor', async () => {
      let received: SeederCtor | undefined;

      @Seeder()
      class SkipArgSeeder {
        async run(_ctx: SeedContext) {}
      }

      await runSeeders([SkipArgSeeder], {
        logging: false,
        skip: (seeder) => {
          received = seeder;
          return false;
        },
      });

      expect(received).toBe(SkipArgSeeder);
    });

    it('skips only the seeders for which skip returns true', async () => {
      const order: string[] = [];

      @Seeder()
      class SkipSelA {
        async run(_ctx: SeedContext) {
          order.push('A');
        }
      }

      @Seeder({ dependencies: [SkipSelA] })
      class SkipSelB {
        async run(_ctx: SeedContext) {
          order.push('B');
        }
      }

      await runSeeders([SkipSelB], {
        logging: false,
        skip: (seeder) => seeder === SkipSelA,
      });

      expect(order).toEqual(['B']);
    });

    it('does not call onBefore or onAfter for skipped seeders', async () => {
      const onBefore = vi.fn();
      const onAfter = vi.fn();

      @Seeder()
      class SkipHookSeeder {
        async run(_ctx: SeedContext) {}
      }

      await runSeeders([SkipHookSeeder], {
        logging: false,
        skip: () => true,
        onBefore,
        onAfter,
      });

      expect(onBefore).not.toHaveBeenCalled();
      expect(onAfter).not.toHaveBeenCalled();
    });
  });

  describe('basic execution', () => {
    it('runs a seeder with no dependencies', async () => {
      const spy = vi.fn();

      @Seeder()
      class StandaloneSeeder {
        async run(_ctx: SeedContext) {
          spy();
        }
      }

      const em = orm.em.fork();
      await runSeeders([StandaloneSeeder], { em });

      expect(spy).toHaveBeenCalledOnce();
    });

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
          await saveMany(SeedUser, { ...ctx, em: ctx.em!, count: 3 });
        }
      }

      const em = orm.em.fork();
      const before = await orm.em.fork().count(SeedUser);
      await runSeeders([UserSeeder], { em });
      const after = await orm.em.fork().count(SeedUser);

      expect(after - before).toBe(3);
    });
  });

  describe('dependency ordering', () => {
    it('runs a dependency before the seeder that declares it', async () => {
      const order: string[] = [];

      @Seeder()
      class DepA {
        async run(_ctx: SeedContext) {
          order.push('A');
        }
      }

      @Seeder({ dependencies: [DepA] })
      class DepB {
        async run(_ctx: SeedContext) {
          order.push('B');
        }
      }

      const em = orm.em.fork();
      await runSeeders([DepB], { em });

      expect(order).toEqual(['A', 'B']);
    });

    it('resolves transitive dependencies in order', async () => {
      const order: string[] = [];

      @Seeder()
      class TransA {
        async run(_ctx: SeedContext) {
          order.push('A');
        }
      }

      @Seeder({ dependencies: [TransA] })
      class TransB {
        async run(_ctx: SeedContext) {
          order.push('B');
        }
      }

      @Seeder({ dependencies: [TransB] })
      class TransC {
        async run(_ctx: SeedContext) {
          order.push('C');
        }
      }

      const em = orm.em.fork();
      await runSeeders([TransC], { em });

      expect(order).toEqual(['A', 'B', 'C']);
    });

    it('does not run a dependency twice when it appears in both roots and as a dep', async () => {
      const spy = vi.fn();

      @Seeder()
      class SharedDep {
        async run(_ctx: SeedContext) {
          spy();
        }
      }

      @Seeder({ dependencies: [SharedDep] })
      class DependsOnShared {
        async run(_ctx: SeedContext) {}
      }

      const em = orm.em.fork();
      await runSeeders([SharedDep, DependsOnShared], { em });

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('hooks', () => {
    it('calls onBefore with the seeder constructor before run()', async () => {
      const events: string[] = [];
      let receivedCtor: SeederCtor | undefined;

      @Seeder()
      class HookOrderSeeder {
        async run(_ctx: SeedContext) {
          events.push('run');
        }
      }

      await runSeeders([HookOrderSeeder], {
        logging: false,
        onBefore: (seeder) => {
          receivedCtor = seeder;
          events.push('before');
        },
      });

      expect(receivedCtor).toBe(HookOrderSeeder);
      expect(events).toEqual(['before', 'run']);
    });

    it('calls onAfter with the seeder constructor and a duration after run()', async () => {
      const events: string[] = [];
      let receivedCtor: SeederCtor | undefined;
      let receivedDuration: number | undefined;

      @Seeder()
      class HookAfterSeeder {
        async run(_ctx: SeedContext) {
          events.push('run');
        }
      }

      await runSeeders([HookAfterSeeder], {
        logging: false,
        onAfter: (seeder, durationMs) => {
          receivedCtor = seeder;
          receivedDuration = durationMs;
          events.push('after');
        },
      });

      expect(receivedCtor).toBe(HookAfterSeeder);
      expect(receivedDuration).toBeGreaterThanOrEqual(0);
      expect(events).toEqual(['run', 'after']);
    });

    it('fires onBefore, run, onAfter in order', async () => {
      const events: string[] = [];

      @Seeder()
      class FullOrderSeeder {
        async run(_ctx: SeedContext) {
          events.push('run');
        }
      }

      await runSeeders([FullOrderSeeder], {
        logging: false,
        onBefore: () => {
          events.push('before');
        },
        onAfter: () => {
          events.push('after');
        },
      });

      expect(events).toEqual(['before', 'run', 'after']);
    });

    it('calls onBefore and onAfter once per seeder in execution order', async () => {
      const beforeOrder: string[] = [];
      const afterOrder: string[] = [];

      @Seeder()
      class HookDepA {
        async run(_ctx: SeedContext) {}
      }

      @Seeder({ dependencies: [HookDepA] })
      class HookDepB {
        async run(_ctx: SeedContext) {}
      }

      await runSeeders([HookDepB], {
        logging: false,
        onBefore: (seeder) => {
          beforeOrder.push(seeder.name);
        },
        onAfter: (seeder) => {
          afterOrder.push(seeder.name);
        },
      });

      expect(beforeOrder).toEqual(['HookDepA', 'HookDepB']);
      expect(afterOrder).toEqual(['HookDepA', 'HookDepB']);
    });

    it('calls onError with the seeder constructor and the thrown error', async () => {
      const boom = new Error('boom');
      let receivedCtor: SeederCtor | undefined;
      let receivedError: unknown;

      @Seeder()
      class FailingSeeder {
        async run(_ctx: SeedContext) {
          throw boom;
        }
      }

      await expect(
        runSeeders([FailingSeeder], {
          logging: false,
          onError: (seeder, err) => {
            receivedCtor = seeder;
            receivedError = err;
          },
        }),
      ).rejects.toThrow('boom');

      expect(receivedCtor).toBe(FailingSeeder);
      expect(receivedError).toBe(boom);
    });

    it('does not call onAfter when a seeder throws', async () => {
      const onAfter = vi.fn();

      @Seeder()
      class ThrowingSeeder {
        async run(_ctx: SeedContext) {
          throw new Error('fail');
        }
      }

      await expect(runSeeders([ThrowingSeeder], { logging: false, onAfter })).rejects.toThrow();

      expect(onAfter).not.toHaveBeenCalled();
    });

    it('re-throws the error after onError completes', async () => {
      const boom = new Error('original');

      @Seeder()
      class RethrowSeeder {
        async run(_ctx: SeedContext) {
          throw boom;
        }
      }

      await expect(
        runSeeders([RethrowSeeder], {
          logging: false,
          onError: () => {},
        }),
      ).rejects.toBe(boom);
    });
  });

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

    it("routes logging through the MikroORM logger when logging is 'mikroorm'", async () => {
      const em = orm.em.fork();
      const loggerSpy = vi.spyOn(em.config.getLogger(), 'log');

      @Seeder()
      class MikroOrmLogSeeder {
        async run(_ctx: SeedContext) {}
      }

      await runSeeders([MikroOrmLogSeeder], { em, logging: 'mikroorm' });

      expect(loggerSpy).toHaveBeenCalledWith(
        'info',
        expect.stringContaining('[MikroOrmLogSeeder]'),
      );
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

  describe('return values', () => {
    it('returns a Map with the return value of each seeder', async () => {
      const users = [{ id: 1 }, { id: 2 }];

      @Seeder()
      class ReturnValueSeeder {
        async run(_ctx: SeedContext) {
          return users;
        }
      }

      const results = await runSeeders([ReturnValueSeeder], { logging: false });

      expect(results.get(ReturnValueSeeder)).toBe(users);
    });

    it('collects return values for all seeders in the suite', async () => {
      @Seeder()
      class ReturnA {
        async run(_ctx: SeedContext) {
          return 'a';
        }
      }

      @Seeder({ dependencies: [ReturnA] })
      class ReturnB {
        async run(_ctx: SeedContext) {
          return 'b';
        }
      }

      const results = await runSeeders([ReturnB], { logging: false });

      expect(results.get(ReturnA)).toBe('a');
      expect(results.get(ReturnB)).toBe('b');
    });

    it('does not include skipped seeders in the results', async () => {
      @Seeder()
      class SkippedReturnSeeder {
        async run(_ctx: SeedContext) {
          return 'should not appear';
        }
      }

      const results = await runSeeders([SkippedReturnSeeder], {
        logging: false,
        skip: () => true,
      });

      expect(results.has(SkippedReturnSeeder)).toBe(false);
    });
  });

  describe('circular dependencies', () => {
    it('throws when a cycle is detected', async () => {
      class CycleA {
        async run(_ctx: SeedContext) {}
      }

      class CycleB {
        async run(_ctx: SeedContext) {}
      }

      registerSeeder(CycleA, { dependencies: [CycleB] });
      registerSeeder(CycleB, { dependencies: [CycleA] });

      await expect(runSeeders([CycleA], {})).rejects.toThrow('Circular dependency');
    });

    it('names the offending seeders in the error message', async () => {
      class LoopX {
        async run(_ctx: SeedContext) {}
      }

      class LoopY {
        async run(_ctx: SeedContext) {}
      }

      registerSeeder(LoopX, { dependencies: [LoopY] });
      registerSeeder(LoopY, { dependencies: [LoopX] });

      await expect(runSeeders([LoopX], {})).rejects.toThrow(/LoopX|LoopY/);
    });
  });
});
