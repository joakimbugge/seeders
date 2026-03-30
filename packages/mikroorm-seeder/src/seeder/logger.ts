/**
 * Logger interface for seeder progress output. Mirrors the method signatures
 * of the global `console` object so any console-compatible object can be used directly.
 */
export interface SeederLogger {
  log(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

/**
 * Default logger implementation. Delegates each method to the corresponding
 * `console` method so output goes to stdout/stderr via Node's standard streams.
 */
export class ConsoleLogger implements SeederLogger {
  log(message: string): void {
    console.log(message);
  }

  info(message: string): void {
    console.info(message);
  }

  warn(message: string): void {
    console.warn(message);
  }

  error(message: string): void {
    console.error(message);
  }

  debug(message: string): void {
    console.debug(message);
  }
}
