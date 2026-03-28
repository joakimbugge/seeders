/**
 * Returns true when `err` was thrown because Node.js tried to import a TypeScript
 * file without a registered loader (ERR_UNKNOWN_FILE_EXTENSION).
 */
export function isTypeScriptImportError(err: unknown): boolean {
  return (
    err instanceof Error && (err as NodeJS.ErrnoException).code === 'ERR_UNKNOWN_FILE_EXTENSION'
  );
}

/**
 * Prints a helpful message when `.ts` files are passed but ts-node is not installed.
 * The CLI attempts to auto-register ts-node at startup, so this error only fires when
 * ts-node is absent from the user's project.
 */
export function printTypeScriptError(command: string): void {
  console.error(
    'Error: TypeScript files require ts-node. Install it in your project:\n\n' +
      '  npm install --save-dev ts-node\n\n' +
      'Then retry — the CLI will detect and load it automatically.\n\n' +
      'Alternatively, point to compiled JS files instead:\n' +
      `  npx @joakimbugge/typeorm-seeder ${command} './dist/...' ...`,
  );
}
