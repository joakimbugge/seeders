import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { seedUntrackCommand } from '../../src/commands/seedUntrack.js';
import { mockExit } from '../utils/mockExit.js';

vi.mock('../../src/utils/loadDataSource.js');

import { loadDataSource } from '../../src/utils/loadDataSource.js';

const TABLE_DDL = `CREATE TABLE "seeders" (name VARCHAR(255) PRIMARY KEY NOT NULL, executed_at VARCHAR(32) NOT NULL)`;

async function createDataSource(): Promise<DataSource> {
  const ds = new DataSource({ type: 'better-sqlite3', database: ':memory:', logging: false });
  await ds.initialize();
  return ds;
}

describe('seedUntrackCommand()', () => {
  afterEach(() => vi.restoreAllMocks());

  it('exits when no name is provided', async () => {
    const exitSpy = mockExit();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(seedUntrackCommand([])).rejects.toThrow('process.exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('seed:untrack'));
  });

  it('removes the seeder from the history table and logs success', async () => {
    const ds = await createDataSource();
    await ds.query(TABLE_DDL);
    await ds.query(
      `INSERT INTO "seeders" (name, executed_at) VALUES ('FixtureAuthorSeeder', '2024-01-01T00:00:00.000Z')`,
    );

    vi.mocked(loadDataSource).mockResolvedValue(ds);
    vi.spyOn(ds, 'destroy').mockResolvedValue();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedUntrackCommand(['FixtureAuthorSeeder']);

    expect(logSpy).toHaveBeenCalledWith('Untracked: FixtureAuthorSeeder');
    expect(await ds.query(`SELECT name FROM "seeders"`)).toHaveLength(0);

    await ds.destroy();
  });

  it('uses a custom table name from --table', async () => {
    const ds = await createDataSource();
    await ds.query(
      `CREATE TABLE "seed_history" (name VARCHAR(255) PRIMARY KEY NOT NULL, executed_at VARCHAR(32) NOT NULL)`,
    );
    await ds.query(
      `INSERT INTO "seed_history" (name, executed_at) VALUES ('FixtureAuthorSeeder', '2024-01-01T00:00:00.000Z')`,
    );

    vi.mocked(loadDataSource).mockResolvedValue(ds);
    vi.spyOn(ds, 'destroy').mockResolvedValue();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedUntrackCommand(['FixtureAuthorSeeder', '--table', 'seed_history']);

    expect(await ds.query(`SELECT name FROM "seed_history"`)).toHaveLength(0);

    await ds.destroy();
  });
});
