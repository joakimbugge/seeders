# CLI

The package ships a CLI binary so you can run seeders or seed entities directly from the terminal without writing a seed script.

## `seed:run`

Loads all `@Seeder`-decorated classes from a glob pattern and runs them in topological order:

```bash
# npm
npx @joakimbugge/mikroorm-seeder seed:run './dist/seeders/*.js' -o ./dist/orm.js

# yarn
yarn @joakimbugge/mikroorm-seeder seed:run './dist/seeders/*.js' -o ./dist/orm.js

# pnpm
pnpm exec @joakimbugge/mikroorm-seeder seed:run './dist/seeders/*.js' -o ./dist/orm.js
```

## `seed:entities`

Loads entity constructors from a glob pattern, filters to those with at least one `@Seed` decorator, and persists `--count` instances of each (default: 1):

```bash
# npm
npx @joakimbugge/mikroorm-seeder seed:entities './dist/entities/*.js' -o ./dist/orm.js --count 20

# yarn
yarn @joakimbugge/mikroorm-seeder seed:entities './dist/entities/*.js' -o ./dist/orm.js --count 20

# pnpm
pnpm exec @joakimbugge/mikroorm-seeder seed:entities './dist/entities/*.js' -o ./dist/orm.js --count 20
```

## npm scripts

A common pattern is to define scripts in `package.json` with the paths baked in:

```json
{
  "scripts": {
    "seed:run": "mikroorm-seeder seed:run './src/seeders/*.ts' -o ./src/orm.ts",
    "seed:entities": "mikroorm-seeder seed:entities './src/entities/*.ts' -o ./src/orm.ts"
  }
}
```

Run them with your package manager:

```bash
npm run seed:run
yarn seed:run
pnpm seed:run
```

To pass extra arguments at call time, npm and pnpm require a `--` separator before any flags; yarn does not:

```bash
npm run seed:entities -- --count 50
yarn seed:entities --count 50
pnpm seed:entities -- --count 50
```

## MikroORM instance

Pass `--orm` (`-o`) with a path to a file that exports a `MikroORM` instance:

```ts
// orm.ts
import { MikroORM } from '@mikro-orm/core'

export default await MikroORM.init({ ... })
```

If the flag is omitted the CLI looks for `mikroorm-seeder.config.ts` then `mikroorm-seeder.config.js` in the current working directory.

## TypeScript files

Install `ts-node` as a dev dependency and the CLI will pick it up automatically — no extra flags needed:

```bash
# npm
npm install --save-dev ts-node

# yarn
yarn add --dev ts-node

# pnpm
pnpm add --save-dev ts-node
```

```bash
# npm
npx @joakimbugge/mikroorm-seeder seed:run './src/seeders/*.ts' -o ./src/orm.ts

# yarn
yarn @joakimbugge/mikroorm-seeder seed:run './src/seeders/*.ts' -o ./src/orm.ts

# pnpm
pnpm exec @joakimbugge/mikroorm-seeder seed:run './src/seeders/*.ts' -o ./src/orm.ts
```

Alternatively, pass `--loader ts-node/esm` explicitly via Node's options:

```bash
node --loader ts-node/esm ./node_modules/.bin/@joakimbugge/mikroorm-seeder seed:run './src/seeders/*.ts' -o ./src/orm.ts
```

If ts-node is not installed, the CLI will print an error with install instructions. You can also point to compiled JS files in your `dist/` directory instead.

::: tip
Wrap glob patterns in single quotes to prevent your shell from expanding them before they reach the CLI. Without quotes, the shell resolves the glob and the CLI receives a list of individual file paths — which also works, but prevents the CLI from using tinyglobby's pattern matching.
:::
