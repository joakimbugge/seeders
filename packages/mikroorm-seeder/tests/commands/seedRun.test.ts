import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { seedRunCommand } from '../../src/commands/seedRun.js';
import { createFixtureOrm } from '../fixtures/orm/FixtureOrm.js';
import { mockExit } from '../utils/mockExit.js';

vi.mock('../../src/utils/loadOrm.js');

import { loadOrm } from '../../src/utils/loadOrm.js';

const fixturesDir = path.resolve(fileURLToPath(import.meta.url), '../../fixtures');
const seedersGlob = path.resolve(fixturesDir, 'seeders/*.ts');

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
