# Versioning rules

This is a pre-1.0 monorepo. Follow these rules when creating changesets.

## Bump type mapping

| Conventional commit | Normal semver | Use in changesets |
|---|---|---|
| `fix:`, `docs:`, `chore:` (public-facing) | patch | `patch` |
| `feat:` | minor | `minor` |
| `feat!:` / `BREAKING CHANGE` | major | `minor` (no 1.0 releases yet) |

## What to include

- Any change to published package source (`src/`) — always include.
- Changes to package `README.md` or `package.json` metadata — `patch`.
- Changes to the `docs/` site — no version bump needed (not published to npm).
- Internal-only changes (tests, CI, build config) — omit entirely.

## Package dependency bumps

When a new feature in `typeorm-seeder` or `mikroorm-seeder` is used by the corresponding NestJS integration package, bump the peer dependency lower bound in that package too and include it in the same changeset.
