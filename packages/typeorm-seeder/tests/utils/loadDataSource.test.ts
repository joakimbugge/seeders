import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDataSource } from '../../src/utils/loadDataSource.js';

const fixturesDir = path.resolve(fileURLToPath(import.meta.url), '../../fixtures');
const datasourcePath = path.resolve(fixturesDir, 'datasources/FixtureDataSource.ts');
const missingPath = path.resolve(fixturesDir, 'nonexistent.js');

describe('loadDataSource()', () => {
  afterEach(() => vi.restoreAllMocks());

  it('exits when the datasource file does not exist', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(loadDataSource(missingPath)).rejects.toThrow('process.exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });

  it('resolves and initializes a DataSource from an explicit path', async () => {
    const ds = await loadDataSource(datasourcePath);

    expect(ds.isInitialized).toBe(true);

    await ds.destroy();
  });
});
