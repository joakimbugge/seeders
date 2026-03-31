import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type MikroORM } from '@mikro-orm/core';
import { seedUntrackCommand } from '../../src/commands/seedUntrack.js';
import { createFixtureOrm } from '../fixtures/orm/FixtureOrm.js';
import { mockExit } from '../utils/mockExit.js';

vi.mock('../../src/utils/loadOrm.js');

import { loadOrm } from '../../src/utils/loadOrm.js';

const TABLE_DDL = `CREATE TABLE "seeders" (name VARCHAR(255) PRIMARY KEY NOT NULL, executed_at VARCHAR(32) NOT NULL)`;

async function rows(orm: MikroORM, table: string): Promise<unknown[]> {
  return orm.em.getConnection().execute(`SELECT name FROM "${table}"`, [], 'all');
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
    const orm = await createFixtureOrm();
    const conn = orm.em.getConnection();
    await conn.execute(TABLE_DDL, [], 'run');
    await conn.execute(
      `INSERT INTO "seeders" (name, executed_at) VALUES ('FixtureAuthorSeeder', '2024-01-01T00:00:00.000Z')`,
      [],
      'run',
    );

    vi.mocked(loadOrm).mockResolvedValue(orm);
    vi.spyOn(orm, 'close').mockResolvedValue();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedUntrackCommand(['FixtureAuthorSeeder']);

    expect(logSpy).toHaveBeenCalledWith('Untracked: FixtureAuthorSeeder');
    expect(await rows(orm, 'seeders')).toHaveLength(0);

    await orm.close();
  });

  it('uses a custom table name from --table', async () => {
    const orm = await createFixtureOrm();
    const conn = orm.em.getConnection();
    await conn.execute(
      `CREATE TABLE "seed_history" (name VARCHAR(255) PRIMARY KEY NOT NULL, executed_at VARCHAR(32) NOT NULL)`,
      [],
      'run',
    );
    await conn.execute(
      `INSERT INTO "seed_history" (name, executed_at) VALUES ('FixtureAuthorSeeder', '2024-01-01T00:00:00.000Z')`,
      [],
      'run',
    );

    vi.mocked(loadOrm).mockResolvedValue(orm);
    vi.spyOn(orm, 'close').mockResolvedValue();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedUntrackCommand(['FixtureAuthorSeeder', '--table', 'seed_history']);

    expect(await rows(orm, 'seed_history')).toHaveLength(0);

    await orm.close();
  });
});
