import { parseArgs } from 'node:util';
import { loadOrm } from '../utils/loadOrm.js';
import { DEFAULT_HISTORY_TABLE } from './constants.js';

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
      orm: { type: 'string', short: 'o' },
      table: { type: 'string', short: 't' },
    },
    allowPositionals: true,
  });

  if (positionals.length === 0) {
    console.error('Usage: seed:untrack <name> [--orm/-o <path>] [--table/-t <name>]');
    process.exit(1);
  }

  const [name] = positionals;
  const tableName = values.table ?? DEFAULT_HISTORY_TABLE;
  const orm = await loadOrm(values.orm);

  try {
    await orm.em
      .getConnection()
      .execute(`DELETE FROM "${tableName}" WHERE name = '${name}'`, [], 'run');
    console.log(`Untracked: ${name}`);
  } finally {
    await orm.close();
  }
}
