# Changelog

## [0.3.2](https://github.com/joakimbugge/seeders/compare/seeder-v0.3.1...seeder-v0.3.2) (2026-05-11)


### Build

* **deps-dev:** bump @types/node from 22.19.17 to 25.6.2 ([#79](https://github.com/joakimbugge/seeders/issues/79)) ([2d44c67](https://github.com/joakimbugge/seeders/commit/2d44c679058ca612199220c567f9e1e91fcc6c39))


### Documentation

* link to all docs in README ([50c8a22](https://github.com/joakimbugge/seeders/commit/50c8a22ced0e0cef42da83e354144f63a8394795))

## [0.3.1](https://github.com/joakimbugge/seeders/compare/seeder-v0.3.0...seeder-v0.3.1) (2026-05-11)


### Features

* new lifecycle hooks (onBefore, onSuccess, onError, onFinally) ([4b32a9d](https://github.com/joakimbugge/seeders/commit/4b32a9d6253c4ae9bc7b77ae64a70cc3a17f206b))
* set target to ES2022 ([7230dbe](https://github.com/joakimbugge/seeders/commit/7230dbe325b5de3b1ecd7812d3f0ef298b464631))


### Bug Fixes

* add seeder suite return type generic to prevent casting ([dedad13](https://github.com/joakimbugge/seeders/commit/dedad135f4a655e02f6412ed7196205590965615))
* prevent types naming conflicts between seeder and orm package ([4b8dd8b](https://github.com/joakimbugge/seeders/commit/4b8dd8b58c39c281ba9cb3d52144fe1d91d68e37))


### Miscellaneous

* set engine.node to &gt;20 ([f715a83](https://github.com/joakimbugge/seeders/commit/f715a83fcd3242e567b5118c954d2087c57b72f9))

## [0.3.0](https://github.com/joakimbugge/seeders/compare/seeder-v0.2.0...seeder-v0.3.0) (2026-04-13)


### Features

* populate context with previously seeded entities ([6daf871](https://github.com/joakimbugge/seeders/commit/6daf871eb34e958d3b9c30d4e20ede46ecf33135))


### Bug Fixes

* correct types and remove unncessary explicit types ([4c1517f](https://github.com/joakimbugge/seeders/commit/4c1517f635facfbee407fcf0d9eb31085045e432))

## [0.2.0](https://github.com/joakimbugge/seeders/compare/seeder-v0.1.0...seeder-v0.2.0) (2026-04-10)


### Features

* base ORM seeders on the new core seeder package ([4682a20](https://github.com/joakimbugge/seeders/commit/4682a2065679b9a2832cc2db62685f7beebfa20d))
* loadEntities and loadSeeders now only exist in @joakimbugge/seeder ([6b396e1](https://github.com/joakimbugge/seeders/commit/6b396e1701b21b00f4335935e1f51c5434a1d7b2))
* make persistanceAdapter optional ([90da602](https://github.com/joakimbugge/seeders/commit/90da60211d7ec09b8953e1bf810a422c0c81b22a))
* move seeder suits, runner and decorator to core package ([56eff84](https://github.com/joakimbugge/seeders/commit/56eff84c7adf12eb111ef31b8140b0c95f15a7dd))


### Miscellaneous

* split builders into separate builder maker files ([b4ac815](https://github.com/joakimbugge/seeders/commit/b4ac815bd65b930a4c31b498194202dbd0a982eb))
