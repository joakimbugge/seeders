import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { seedEntitiesCommand } from '../../src/commands/seedEntities.js';
import { mockExit } from '../utils/mockExit.js';

const fixturesDir = path.resolve(fileURLToPath(import.meta.url), '../../fixtures');
const datasourcePath = path.resolve(fixturesDir, 'datasources/FixtureDataSource.ts');
const entitiesGlob = path.resolve(fixturesDir, 'entities/*.ts');

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

    await expect(
      seedEntitiesCommand([entitiesGlob, '-d', datasourcePath, '--count', '0']),
    ).rejects.toThrow('process.exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('--count'));
  });

  it('seeds entities with @Seed decorators and logs each one', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedEntitiesCommand([entitiesGlob, '-d', datasourcePath, '--count', '3']);

    expect(logSpy).toHaveBeenCalledWith('Seeded 3 × FixtureAuthor');
    expect(logSpy).toHaveBeenCalledWith('Seeded 3 × FixtureBook');
  });
});
