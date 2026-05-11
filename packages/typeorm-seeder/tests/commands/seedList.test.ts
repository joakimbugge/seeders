import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { seedListCommand } from '../../src/commands/seedList.js';

vi.mock('../../src/utils/loadDataSource.js');

import { loadDataSource } from '../../src/utils/loadDataSource.js';

const TABLE_DDL = `CREATE TABLE "seeders" (name VARCHAR(255) NOT NULL, executed_at VARCHAR(32) NOT NULL)`;

async function createDataSource(): Promise<DataSource> {
  const ds = new DataSource({ type: 'better-sqlite3', database: ':memory:', logging: false });
  await ds.initialize();
  return ds;
}

describe('seedListCommand()', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs an error when the history table does not exist', async () => {
    const ds = await createDataSource();

    vi.mocked(loadDataSource).mockResolvedValue(ds);
    vi.spyOn(ds, 'destroy').mockResolvedValue();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedListCommand([]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('does not exist'));

    await ds.destroy();
  });

  it('logs when no seeders have been tracked yet', async () => {
    const ds = await createDataSource();
    await ds.query(TABLE_DDL);

    vi.mocked(loadDataSource).mockResolvedValue(ds);
    vi.spyOn(ds, 'destroy').mockResolvedValue();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedListCommand([]);

    expect(logSpy).toHaveBeenCalledWith('No seeders have been tracked yet.');

    await ds.destroy();
  });

  it('calls console.table with the rows when seeders exist', async () => {
    const ds = await createDataSource();
    await ds.query(TABLE_DDL);
    await ds.query(
      `INSERT INTO "seeders" (name, executed_at) VALUES ('UserSeeder', '2024-01-01T00:00:00.000Z')`,
    );

    vi.mocked(loadDataSource).mockResolvedValue(ds);
    vi.spyOn(ds, 'destroy').mockResolvedValue();
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    await seedListCommand([]);

    expect(tableSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'UserSeeder', executed_at: '2024-01-01T00:00:00.000Z' }),
      ]),
    );

    await ds.destroy();
  });

  it('uses a custom table name from --table', async () => {
    const ds = await createDataSource();
    await ds.query(
      `CREATE TABLE "seed_history" (name VARCHAR(255) NOT NULL, executed_at VARCHAR(32) NOT NULL)`,
    );
    await ds.query(
      `INSERT INTO "seed_history" (name, executed_at) VALUES ('PostSeeder', '2024-06-01T00:00:00.000Z')`,
    );

    vi.mocked(loadDataSource).mockResolvedValue(ds);
    vi.spyOn(ds, 'destroy').mockResolvedValue();
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    await seedListCommand(['--table', 'seed_history']);

    expect(tableSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'PostSeeder' })]),
    );

    await ds.destroy();
  });

  it('uses the short -t flag for table name', async () => {
    const ds = await createDataSource();
    await ds.query(
      `CREATE TABLE "short_hist" (name VARCHAR(255) NOT NULL, executed_at VARCHAR(32) NOT NULL)`,
    );
    await ds.query(
      `INSERT INTO "short_hist" (name, executed_at) VALUES ('SomeSeeder', '2024-06-01T00:00:00.000Z')`,
    );

    vi.mocked(loadDataSource).mockResolvedValue(ds);
    vi.spyOn(ds, 'destroy').mockResolvedValue();
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    await seedListCommand(['-t', 'short_hist']);

    expect(tableSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'SomeSeeder' })]),
    );

    await ds.destroy();
  });

  it('always destroys the data source even when the table does not exist', async () => {
    const ds = await createDataSource();

    vi.mocked(loadDataSource).mockResolvedValue(ds);
    const destroySpy = vi.spyOn(ds, 'destroy').mockResolvedValue();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await seedListCommand([]);

    expect(destroySpy).toHaveBeenCalledOnce();

    await ds.destroy();
  });

  it('always destroys the data source after listing rows', async () => {
    const ds = await createDataSource();
    await ds.query(TABLE_DDL);
    await ds.query(
      `INSERT INTO "seeders" (name, executed_at) VALUES ('UserSeeder', '2024-01-01T00:00:00.000Z')`,
    );

    vi.mocked(loadDataSource).mockResolvedValue(ds);
    const destroySpy = vi.spyOn(ds, 'destroy').mockResolvedValue();
    vi.spyOn(console, 'table').mockImplementation(() => {});

    await seedListCommand([]);

    expect(destroySpy).toHaveBeenCalledOnce();

    await ds.destroy();
  });
});
