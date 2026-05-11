import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { seedListCommand } from '../../src/commands/seedList.js';
import { createFixtureOrm } from '../fixtures/orm/FixtureOrm.js';

vi.mock('../../src/utils/loadOrm.js');

import { loadOrm } from '../../src/utils/loadOrm.js';

const TABLE_DDL = `CREATE TABLE "seeders" (name VARCHAR(255) NOT NULL, executed_at VARCHAR(32) NOT NULL)`;

describe('seedListCommand()', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs an error when the history table does not exist', async () => {
    const orm = await createFixtureOrm();

    vi.mocked(loadOrm).mockResolvedValue(orm);
    vi.spyOn(orm, 'close').mockResolvedValue();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedListCommand([]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('does not exist'));

    await orm.close();
  });

  it('logs when no seeders have been tracked yet', async () => {
    const orm = await createFixtureOrm();
    await orm.em.getConnection().execute(TABLE_DDL, [], 'run');

    vi.mocked(loadOrm).mockResolvedValue(orm);
    vi.spyOn(orm, 'close').mockResolvedValue();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedListCommand([]);

    expect(logSpy).toHaveBeenCalledWith('No seeders have been tracked yet.');

    await orm.close();
  });

  it('calls console.table with the rows when seeders exist', async () => {
    const orm = await createFixtureOrm();
    const conn = orm.em.getConnection();
    await conn.execute(TABLE_DDL, [], 'run');
    await conn.execute(
      `INSERT INTO "seeders" (name, executed_at) VALUES ('UserSeeder', '2024-01-01T00:00:00.000Z')`,
      [],
      'run',
    );

    vi.mocked(loadOrm).mockResolvedValue(orm);
    vi.spyOn(orm, 'close').mockResolvedValue();
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    await seedListCommand([]);

    expect(tableSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'UserSeeder', executed_at: '2024-01-01T00:00:00.000Z' }),
      ]),
    );

    await orm.close();
  });

  it('uses a custom table name from --table', async () => {
    const orm = await createFixtureOrm();
    const conn = orm.em.getConnection();
    await conn.execute(
      `CREATE TABLE "seed_history" (name VARCHAR(255) NOT NULL, executed_at VARCHAR(32) NOT NULL)`,
      [],
      'run',
    );
    await conn.execute(
      `INSERT INTO "seed_history" (name, executed_at) VALUES ('PostSeeder', '2024-06-01T00:00:00.000Z')`,
      [],
      'run',
    );

    vi.mocked(loadOrm).mockResolvedValue(orm);
    vi.spyOn(orm, 'close').mockResolvedValue();
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    await seedListCommand(['--table', 'seed_history']);

    expect(tableSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'PostSeeder' })]),
    );

    await orm.close();
  });

  it('uses the short -t flag for table name', async () => {
    const orm = await createFixtureOrm();
    const conn = orm.em.getConnection();
    await conn.execute(
      `CREATE TABLE "short_hist" (name VARCHAR(255) NOT NULL, executed_at VARCHAR(32) NOT NULL)`,
      [],
      'run',
    );
    await conn.execute(
      `INSERT INTO "short_hist" (name, executed_at) VALUES ('SomeSeeder', '2024-06-01T00:00:00.000Z')`,
      [],
      'run',
    );

    vi.mocked(loadOrm).mockResolvedValue(orm);
    vi.spyOn(orm, 'close').mockResolvedValue();
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    await seedListCommand(['-t', 'short_hist']);

    expect(tableSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'SomeSeeder' })]),
    );

    await orm.close();
  });

  it('always closes the orm even when the table does not exist', async () => {
    const orm = await createFixtureOrm();

    vi.mocked(loadOrm).mockResolvedValue(orm);
    const closeSpy = vi.spyOn(orm, 'close').mockResolvedValue();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedListCommand([]);

    expect(closeSpy).toHaveBeenCalledOnce();

    await orm.close();
  });

  it('always closes the orm after listing rows', async () => {
    const orm = await createFixtureOrm();
    const conn = orm.em.getConnection();
    await conn.execute(TABLE_DDL, [], 'run');
    await conn.execute(
      `INSERT INTO "seeders" (name, executed_at) VALUES ('UserSeeder', '2024-01-01T00:00:00.000Z')`,
      [],
      'run',
    );

    vi.mocked(loadOrm).mockResolvedValue(orm);
    const closeSpy = vi.spyOn(orm, 'close').mockResolvedValue();
    vi.spyOn(console, 'table').mockImplementation(() => {});

    await seedListCommand([]);

    expect(closeSpy).toHaveBeenCalledOnce();

    await orm.close();
  });
});
