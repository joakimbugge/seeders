# Monorepo structure

Four packages across two ORM families:
- `@joakimbugge/typeorm-seeder` + `@joakimbugge/nest-typeorm-seeder`
- `@joakimbugge/mikroorm-seeder` + `@joakimbugge/nest-mikroorm-seeder`

NestJS packages are thin DI wrappers around their core counterparts.

## Commands

```bash
npm run build       # Build all packages
npm test            # Run all tests (vitest, non-watch)
npm run typecheck   # Type-check all packages
npm run lint:fix    # Lint with oxlint
npm run fmt         # Format with oxfmt
npm run dev:watch   # Build + typecheck watch mode for all packages in parallel
```

Package manager is **npm workspaces** — not pnpm. There is no `workspace:` protocol: cross-package deps use real semver ranges, kept in sync by Release Please's `node-workspace` plugin. Target a single package with `-w`, e.g. `npm run build -w @joakimbugge/seeder`.

## Tooling

- Bundler: `tsdown` (dual ESM/CJS output with `.mjs`/`.cjs` extensions)
- Linter: `oxlint` — not ESLint
- Formatter: `oxfmt` — not Prettier
- Tests: `vitest` with globals enabled (no imports needed for `describe`/`it`/`expect`)
- Docs: `vitepress` **2.x alpha**, deliberately. 1.6.4 (the newest stable) is pinned to vite 5, which carries three unfixable advisories including a high-severity path traversal and a Windows NTLM hash disclosure. All three are dev-server-only and never reached consumers, but they made Dependabot's security updates fail on every push. vitepress 2 uses vite 8 and clears them. Do not "fix" this by downgrading to stable; revisit once vitepress 2.0 ships.

# Versioning and release

Releases are fully automated via [Release Please](https://github.com/googleapis/release-please). There are no changeset files — do not create them.

## How it works

After CI passes on a push to `main`, Release Please reads the conventional commit prefixes and the files each commit touched to determine which packages need a new version. It opens and maintains a single "chore: release" PR. Merging that PR publishes to npm and redeploys the docs.

## Bump type mapping

| Conventional commit | Bump |
|---|---|
| `fix:`, `docs:` (public-facing) | patch |
| `feat:` | minor |
| `feat!:` / `BREAKING CHANGE` | minor (no 1.0 releases yet — use minor instead of major) |
| `docs:`, `chore:`, `refactor:` touching only non-package files | no release |

## Package attribution

Release Please determines which packages a commit belongs to by looking at which files were changed — not by commit scope. A commit touching `packages/mikroorm-seeder/src/...` is attributed to `@joakimbugge/mikroorm-seeder` only. A commit touching files in multiple package directories is attributed to all of them.

## Coverage

Each package's `test:cov` writes `packages/<name>/coverage/lcov.info` with paths relative to that
package, so all five report identical entries like `SF:src/seed/registry.ts`. Codecov resolves
those against the whole repo, cannot tell the workspaces apart, and silently attributes coverage to
the wrong package.

CI therefore runs `node scripts/prefix-lcov.mjs` before uploading, which rewrites the paths to
repo-relative form and fails if any of them do not exist on disk. If you add a package, no change
is needed there — it discovers packages by directory — but do add a matching component to
`codecov.yml` and its lcov path to the upload lists in `ci.yml` and `release.yml`.

Per-package breakdowns come from Codecov **components**, not flags, because one CI job uploads
everything at once. `patch` status is `informational` for now; remove that to make it a gate.

## Publish authentication

Publishing uses npm **trusted publishing** (OIDC), not an `NPM_TOKEN` secret. npm mints a short-lived token from the workflow's OIDC identity, and provenance attestations are generated automatically.

Consequences to respect:

- **`npm publish` must stay in `.github/workflows/release.yml`.** Each package's trusted publisher on npmjs.com names that exact filename. Renaming the file, or publishing from a different workflow, breaks releases until the publisher config is updated on npmjs.com.
- The publish job needs `id-token: write`. Do not remove it.
- Reusable workflows (`workflow_call`) and self-hosted runners are unsupported by trusted publishing.
- Only one trusted publisher exists per package, which is why there is no second manual-publish workflow.

## Install scripts

npm 12 blocks dependency lifecycle scripts unless the root `package.json` lists the package under `allowScripts`. Four dev dependencies need theirs: `better-sqlite3` (native binary for tests), `lefthook` (installs git hooks), `esbuild`, and `@swc/core`.

Entries are deliberately name-only rather than version-pinned, so routine Dependabot bumps don't silently skip a build step. When a new dependency needs install scripts, run `npm install-scripts ls` to see what was skipped, then `npm approve-scripts <pkg> --no-allow-scripts-pin`. A missing entry fails quietly: the install succeeds, but the native binary never gets built.

CI pins `npm@12` explicitly so this policy is exercised on every run rather than discovered at release time. Note npm 12 requires Node `^22.22.2 || ^24.15.0 || >=26.0.0`.

## llms.txt

Each package has a `llms.txt` (and `docs/public/llms.txt` for the site). When updating docs or READMEs, also update the relevant `llms.txt` files to keep them in sync.

## What not to do

- Do not run `npm run changeset` — changesets have been removed.
- Do not manually edit `package.json` version fields — Release Please owns those.
- Do not manually edit `CHANGELOG.md` files — Release Please owns those too.
