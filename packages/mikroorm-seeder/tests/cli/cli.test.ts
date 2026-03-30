import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { seedEntitiesCommand } from '../../src/commands/seedEntities.js';
import { seedRunCommand } from '../../src/commands/seedRun.js';
import { createFixtureOrm } from '../fixtures/orm/FixtureOrm.js';

vi.mock('../../src/utils/loadOrm.js');

import { loadOrm } from '../../src/utils/loadOrm.js';

// ─── Paths ───────────────────────────────────────────────────────────────────

const fixturesDir = path.resolve(fileURLToPath(import.meta.url), '../../fixtures');
const entitiesGlob = path.resolve(fixturesDir, 'entities/*.ts');
const seedersGlob = path.resolve(fixturesDir, 'seeders/*.ts');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Mocks process.exit so it throws instead of terminating the test process. */
function mockExit() {
  return vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit');
  });
}

// ─── seedRunCommand() ────────────────────────────────────────────────────────

describe('seedRunCommand()', () => {
  afterEach(() => vi.restoreAllMocks());

  it('exits when no glob patterns are provided', async () => {
    const exitSpy = mockExit();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(seedRunCommand([])).rejects.toThrow('process.exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('seed:run'));
  });

  it('runs seeders from a glob pattern', async () => {
    vi.mocked(loadOrm).mockResolvedValue(await createFixtureOrm());

    await expect(seedRunCommand([seedersGlob])).resolves.toBeUndefined();
  });
});

// ─── seedEntitiesCommand() ───────────────────────────────────────────────────

describe('seedEntitiesCommand()', () => {
  afterEach(() => vi.restoreAllMocks());

  it('exits when no glob patterns are provided', async () => {
    const exitSpy = mockExit();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(seedEntitiesCommand([])).rejects.toThrow('process.exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('seed:entities'));
  });

  it('exits when --count is not a positive integer', async () => {
    const exitSpy = mockExit();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(seedEntitiesCommand([entitiesGlob, '--count', '0'])).rejects.toThrow(
      'process.exit',
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('--count'));
  });

  it('seeds entities with @Seed decorators and logs each one', async () => {
    vi.mocked(loadOrm).mockResolvedValue(await createFixtureOrm());
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedEntitiesCommand([entitiesGlob, '--count', '3']);

    expect(logSpy).toHaveBeenCalledWith('Seeded 3 × FixtureAuthor');
    expect(logSpy).toHaveBeenCalledWith('Seeded 3 × FixtureBook');
  });
});
