# @joakimbugge/nest-mikroorm-seeder

## [0.3.2](https://github.com/joakimbugge/seeders/compare/nest-mikroorm-seeder-v0.3.1...nest-mikroorm-seeder-v0.3.2) (2026-05-11)


### Features

* new lifecycle hooks (onBefore, onSuccess, onError, onFinally) ([4b32a9d](https://github.com/joakimbugge/seeders/commit/4b32a9d6253c4ae9bc7b77ae64a70cc3a17f206b))


### Bug Fixes

* prevent re-assigning `this` ([537700c](https://github.com/joakimbugge/seeders/commit/537700c36c3497d3367b15a3e9adc58e6a521302))


### Build

* **deps-dev:** bump @mikro-orm/decorators from 7.0.6 to 7.0.12 ([#70](https://github.com/joakimbugge/seeders/issues/70)) ([29bdf47](https://github.com/joakimbugge/seeders/commit/29bdf47b089af5b9ad49ccf636dd01fadd1b41fa))
* **deps-dev:** bump @nestjs/testing from 11.1.17 to 11.1.19 ([#68](https://github.com/joakimbugge/seeders/issues/68)) ([73fa635](https://github.com/joakimbugge/seeders/commit/73fa635ed618c81a032f7b8afcea60c6fd02c4e1))
* **deps:** bump mikroorm to 7.0.15 and nest to 11.1.19 ([2e5ad16](https://github.com/joakimbugge/seeders/commit/2e5ad16f3b76f7d539a9bec17414076c73bb01d9))


### Miscellaneous

* fix formatting ([115c27e](https://github.com/joakimbugge/seeders/commit/115c27e7cad4c0989a549d5804188b873b9a7e44))
* set engine.node to &gt;20 ([f715a83](https://github.com/joakimbugge/seeders/commit/f715a83fcd3242e567b5118c954d2087c57b72f9))

## [0.3.1](https://github.com/joakimbugge/seeders/compare/nest-mikroorm-seeder-v0.3.0...nest-mikroorm-seeder-v0.3.1) (2026-04-13)


### Bug Fixes

* correct types and remove unncessary explicit types ([4c1517f](https://github.com/joakimbugge/seeders/commit/4c1517f635facfbee407fcf0d9eb31085045e432))

## [0.3.0](https://github.com/joakimbugge/seeders/compare/nest-mikroorm-seeder-v0.2.0...nest-mikroorm-seeder-v0.3.0) (2026-04-13)


### Features

* add llms.txt ([cec5be6](https://github.com/joakimbugge/seeders/commit/cec5be634d7dcaf397d76dd547ef55c10005d29a))

## [0.2.0](https://github.com/joakimbugge/seeders/compare/nest-mikroorm-seeder-v0.1.1...nest-mikroorm-seeder-v0.2.0) (2026-04-10)


### Features

* loadEntities and loadSeeders now only exist in @joakimbugge/seeder ([6b396e1](https://github.com/joakimbugge/seeders/commit/6b396e1701b21b00f4335935e1f51c5434a1d7b2))

## 0.1.1

### Patch Changes

- [`5f65343`](https://github.com/joakimbugge/seeders/commit/5f653435000e87d40f63a398d5150a61d5983d1f) Thanks [@joakimbugge](https://github.com/joakimbugge)! - Export previously internal types: `SingleSeed`, `MultiSeed`, `MapToInstances`, and `MapToInstanceArrays` from the core seeder packages; `SeederModuleSeedersOptions`, `SeederModuleRunOptions`, and `SeederModuleFeatureOnlyOptions` from the NestJS integration packages.

- Updated dependencies [[`5f65343`](https://github.com/joakimbugge/seeders/commit/5f653435000e87d40f63a398d5150a61d5983d1f)]:
  - @joakimbugge/mikroorm-seeder@0.1.1
