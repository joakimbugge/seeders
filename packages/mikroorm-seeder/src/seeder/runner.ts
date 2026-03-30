import { DepGraph } from 'dependency-graph';
import { getSeederMeta } from './registry.js';
import { ConsoleLogger } from './logger.js';
import type { SeederLogger } from './logger.js';
import type { SeederInterface } from './decorator.js';
import type { SeedContext } from '../seed/registry.js';

export type SeederCtor = new () => SeederInterface;

export interface RunSeedersOptions extends SeedContext {
  /**
   * Controls seeder progress output.
   * - `false` (default) — no output.
   * - `true` — logs via {@link ConsoleLogger} (or a custom {@link SeederLogger} if provided).
   * @default false
   */
  logging?: false | true;
  logger?: SeederLogger;
  onBefore?: (seeder: SeederCtor) => void | Promise<void>;
  onAfter?: (seeder: SeederCtor, durationMs: number) => void | Promise<void>;
  onError?: (seeder: SeederCtor, error: unknown) => void | Promise<void>;
  skip?: (seeder: SeederCtor) => boolean | Promise<boolean>;
}

function topoSort(roots: SeederCtor[]): SeederCtor[] {
  const graph = new DepGraph<SeederCtor>();
  const byName = new Map<string, SeederCtor>();

  const visited = new Set<SeederCtor>();
  const queue: SeederCtor[] = [...roots];

  while (queue.length > 0) {
    const node = queue.shift()!;

    if (visited.has(node)) {
      continue;
    }

    visited.add(node);
    graph.addNode(node.name, node);
    byName.set(node.name, node);

    for (const dep of (getSeederMeta(node)?.dependencies ?? []) as SeederCtor[]) {
      queue.push(dep);
    }
  }

  for (const node of visited) {
    for (const dep of (getSeederMeta(node)?.dependencies ?? []) as SeederCtor[]) {
      graph.addDependency(node.name, dep.name);
    }
  }

  try {
    return graph.overallOrder().map((name) => byName.get(name)!);
  } catch (err) {
    if (err && typeof err === 'object' && 'cyclePath' in err) {
      const path = (err as { cyclePath: string[] }).cyclePath.join(' → ');
      throw new Error(`Circular dependency detected among seeders: ${path}`);
    }

    throw err;
  }
}

function resolveLog(
  logging: false | true,
  logger: SeederLogger | undefined,
): { progress(msg: string): void; failure(msg: string): void } | null {
  if (!logging) {
    return null;
  }

  const log = logger ?? new ConsoleLogger();

  return {
    progress: (msg) => log.log(msg),
    failure: (msg) => log.warn(msg),
  };
}

export async function runSeeders(
  seeders: SeederCtor[],
  options: RunSeedersOptions = {},
): Promise<Map<SeederCtor, unknown>> {
  const { logging = false, logger, onBefore, onAfter, onError, skip, ...context } = options;
  const results = new Map<SeederCtor, unknown>();
  const log = resolveLog(logging, logger);

  for (const SeederClass of topoSort(seeders)) {
    if (await skip?.(SeederClass)) {
      continue;
    }

    log?.progress(`[${SeederClass.name}] Starting...`);
    await onBefore?.(SeederClass);

    const start = Date.now();

    try {
      results.set(SeederClass, await new SeederClass().run(context));
    } catch (err) {
      const durationMs = Date.now() - start;

      log?.failure(`[${SeederClass.name}] Failed after ${durationMs}ms`);
      await onError?.(SeederClass, err);
      throw err;
    }

    const durationMs = Date.now() - start;

    log?.progress(`[${SeederClass.name}] Done in ${durationMs}ms`);
    await onAfter?.(SeederClass, durationMs);
  }

  return results;
}
