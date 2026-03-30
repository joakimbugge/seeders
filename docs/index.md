---
layout: home

hero:
  name: to-seeder
  text: Decorator-based entity seeding
  tagline: Annotate entities with @Seed(), create or persist fully populated entity graphs — relations, embedded types, and circular guards included. Works with TypeORM and MikroORM.
  actions:
    - theme: brand
      text: TypeORM
      link: /guide/
    - theme: brand
      text: MikroORM
      link: /mikroorm/
    - theme: alt
      text: GitHub
      link: https://github.com/joakimbugge/to-seeder

features:
  - title: '@Seed() decorator'
    details: Mark entity properties with factory functions. Relations, embedded types, and circular references are handled automatically.
  - title: Seeder suites
    details: Organize seeding logic into @Seeder classes with declared dependencies. The library sorts and executes them in the correct order.
  - title: NestJS integration
    details: SeederModule runs seeders on application bootstrap with run-once tracking. Watch-mode restarts don't re-seed.
  - title: CLI
    details: Run seeder suites or seed individual entities from the terminal without writing a seed script. (TypeORM only)
---
