/**
 * Rewrites the `SF:` paths in each workspace package's lcov report so they are relative to the
 * repository root instead of the package root.
 *
 * vitest emits coverage paths relative to the package it ran in, so every package produces
 * identical entries like `SF:src/seed/registry.ts`. Codecov resolves those against the whole
 * repository and cannot tell which workspace they belong to, so shared paths silently collapse
 * onto whichever package matches first and the rest of the tree goes untracked.
 *
 * Prefixing each path with its package directory removes the ambiguity. Every rewritten path is
 * then checked against the filesystem, and the script exits non-zero if any of them fail to
 * resolve — a mismatch here is invisible in the Codecov UI, so it has to break the build instead.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const packagesDir = path.join(repoRoot, 'packages');

const toPosix = (value) => value.split(path.sep).join('/').replaceAll('\\', '/');

let reportsRewritten = 0;
let pathsRewritten = 0;
const missing = [];

for (const pkg of readdirSync(packagesDir, { withFileTypes: true })) {
  if (!pkg.isDirectory()) {
    continue;
  }

  const lcovPath = path.join(packagesDir, pkg.name, 'coverage', 'lcov.info');

  if (!existsSync(lcovPath)) {
    console.log(`- ${pkg.name}: no lcov report, skipped`);
    continue;
  }

  const prefix = `packages/${pkg.name}/`;
  let rewrittenInReport = 0;

  const output = readFileSync(lcovPath, 'utf8')
    .split('\n')
    .map((line) => {
      if (!line.startsWith('SF:')) {
        return line;
      }

      const raw = line.slice(3).trim();
      // v8 sometimes emits absolute paths; make those repo-relative before anything else.
      const relative = path.isAbsolute(raw) ? path.relative(repoRoot, raw) : raw;
      const normalized = toPosix(relative);
      const prefixed = normalized.startsWith('packages/') ? normalized : prefix + normalized;

      if (!existsSync(path.join(repoRoot, prefixed))) {
        missing.push(prefixed);
      }

      rewrittenInReport += 1;
      return `SF:${prefixed}`;
    })
    .join('\n');

  writeFileSync(lcovPath, output);

  reportsRewritten += 1;
  pathsRewritten += rewrittenInReport;
  console.log(`- ${pkg.name}: ${rewrittenInReport} paths -> ${prefix}`);
}

console.log(`\nRewrote ${pathsRewritten} paths across ${reportsRewritten} lcov reports.`);

if (missing.length > 0) {
  console.error(
    `\nError: ${missing.length} coverage path(s) do not exist in the repository. Codecov would ` +
      'silently drop these, so failing instead:',
  );
  for (const file of missing) {
    console.error(`  ${file}`);
  }
  process.exit(1);
}

if (reportsRewritten === 0) {
  console.error('\nError: no lcov reports found. Did the coverage run fail?');
  process.exit(1);
}
