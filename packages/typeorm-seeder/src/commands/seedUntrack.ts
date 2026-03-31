import { parseArgs } from 'node:util';
import { loadDataSource } from '../utils/loadDataSource.js';

const DEFAULT_TABLE = 'seeders';

/**
 * Handles the `seed:untrack` CLI command.
 *
 * Removes a seeder entry from the history table so it will be executed again
 * on the next application boot.
 */
export async function seedUntrackCommand(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      datasource: { type: 'string', short: 'd' },
      table: { type: 'string', short: 't' },
    },
    allowPositionals: true,
  });

  if (positionals.length === 0) {
    console.error('Usage: seed:untrack <name> [--datasource/-d <path>] [--table/-t <name>]');
    process.exit(1);
  }

  const [name] = positionals;
  const tableName = values.table ?? DEFAULT_TABLE;
  const dataSource = await loadDataSource(values.datasource);

  try {
    await dataSource.query(`DELETE FROM "${tableName}" WHERE name = '${name}'`);
    console.log(`Untracked: ${name}`);
  } finally {
    await dataSource.destroy();
  }
}
