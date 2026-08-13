import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadOrm } from '../../src/utils/loadOrm.js';
import { mockExit } from './mockExit.js';

const fixturesDir = path.resolve(fileURLToPath(import.meta.url), '../../fixtures');
const ormPath = path.resolve(fixturesDir, 'orm/FixtureOrmExport.ts');
const missingPath = path.resolve(fixturesDir, 'nonexistent.js');

describe('loadOrm()', () => {
  afterEach(() => vi.restoreAllMocks());

  it('exits when the orm file does not exist', async () => {
    const exitSpy = mockExit();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(loadOrm(missingPath)).rejects.toThrow('process.exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });

  it('exits when no orm path is provided and no config file exists in cwd', async () => {
    const exitSpy = mockExit();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'cwd').mockReturnValue('/nonexistent-dir-mikroorm-loadorm-test');

    await expect(loadOrm()).rejects.toThrow('process.exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No MikroORM instance found'));
  });

  // loadOrm() imports the fixture at runtime, which is the whole point of this test, so the
  // first-touch cost of the @mikro-orm graph and better-sqlite3 lands inside the test body and
  // counts against testTimeout. Every other test in this package reaches that graph through a
  // static import instead, where the cost falls in the untimed collect phase. On a cold file
  // cache — a fresh install, or CI right after `npm ci` — that import alone has exceeded the 5s
  // default, so this test gets explicit headroom.
  it('resolves a MikroORM instance from an explicit path', async () => {
    const orm = await loadOrm(ormPath);

    expect(typeof orm.close).toBe('function');

    await orm.close();
  }, 30_000);
});
