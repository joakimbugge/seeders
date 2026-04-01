import { parseArgs } from 'node:util';
import { loadDataSource } from '../utils/loadDataSource.js';
import { DEFAULT_HISTORY_TABLE } from './constants.js';

/**
 * Handles the `seed:list` CLI command.
 *
 * Queries the history table and prints all tracked seeder runs as a table.
 */
export async function seedListCommand(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      datasource: { type: 'string', short: 'd' },
      table: { type: 'string', short: 't' },
    },
  });

  const tableName = values.table ?? DEFAULT_HISTORY_TABLE;
  const dataSource = await loadDataSource(values.datasource);

  try {
    let rows: { name: string; executed_at: string }[];

    try {
      rows = await dataSource.query(
        `SELECT name, executed_at FROM "${tableName}" ORDER BY executed_at ASC`,
      );
    } catch {
      console.log(
        `History table '${tableName}' does not exist. Has the application been started yet?`,
      );
      return;
    }

    if (rows.length === 0) {
      console.log('No seeders have been tracked yet.');
      return;
    }

    console.table(rows);
  } finally {
    await dataSource.destroy();
  }
}
