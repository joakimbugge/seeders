export { Seed } from './seed/decorator.js';
export { create } from './seed/creators/create.js';
export { createMany } from './seed/creators/createMany.js';
export { save } from './seed/persist/save.js';
export { saveMany } from './seed/persist/saveMany.js';
export { makeSeedBuilder } from './seed/builder/makeSeedBuilder.js';
export type { SingleSeed, SingleSeed as BaseSingleSeed } from './seed/builder/makeSeedBuilder.js';
export { makeMultiSeedBuilder } from './seed/builder/makeMultiSeedBuilder.js';
export type { MultiSeed, MultiSeed as BaseMultiSeed } from './seed/builder/makeMultiSeedBuilder.js';
export type {
  MetadataAdapter,
  PersistenceAdapter,
  EmbeddedEntry,
  RelationEntry,
} from './seed/adapter.js';
// Base* aliases are consumed by ORM adapter packages (typeorm-seeder, mikroorm-seeder) under their
// original names. When a DTS bundle contains both a re-exported name and a local type definition
// with the same name, the bundler appends a `$1` suffix to disambiguate — making the output
// confusing to consumers. Importing under a distinct Base* name avoids the collision entirely.
export type {
  EntityInstance,
  EntityConstructor,
  SeedContext,
  SeedFactory,
  SeedOptions,
  SeedEntry,
  MapToInstances,
  MapToInstanceArrays,
  SeedContext as BaseSeedContext,
  SeedFactory as BaseSeedFactory,
} from './seed/registry.js';
export { registerSeed, getSeeds } from './seed/registry.js';
export type { CreateOptions, SeedValues } from './seed/creators/create.js';
export type { CreateManyOptions } from './seed/creators/createMany.js';
export { Seeder } from './seeder/decorator.js';
export type { SeederInterface, SeederOptions } from './seeder/decorator.js';
export type {
  SeederRunContext,
  SeederRunContext as BaseSeederRunContext,
} from './seeder/context.js';
export { registerSeeder, getSeederMeta } from './seeder/registry.js';
export type { SeederMeta } from './seeder/registry.js';
export { ConsoleLogger } from './seeder/logger.js';
export type { SeederLogger } from './seeder/logger.js';
export { runSeeders } from './seeder/runner.js';
export type {
  SeederCtor,
  SeederResultMap,
  RunSeedersOptions,
  RunSeedersOptions as BaseRunSeedersOptions,
} from './seeder/runner.js';
export { importGlob } from './utils/importGlob.js';
export { collectConstructors } from './utils/collectConstructors.js';
export { loadEntities } from './utils/loadEntities.js';
export { loadSeeders } from './utils/loadSeeders.js';
