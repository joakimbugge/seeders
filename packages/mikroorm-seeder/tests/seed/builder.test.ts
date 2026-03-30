import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Seed, seed } from '../../src';

@Entity()
class Studio {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.company.name())
  @Property()
  name!: string;
}

@Entity()
class Director {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.person.fullName())
  @Property()
  name!: string;

  @Seed({ count: 2 })
  @OneToMany(() => Film, (f) => f.director)
  films!: Film[];
}

@Entity()
class Film {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.lorem.words(3))
  @Property()
  title!: string;

  @Seed()
  @ManyToOne(() => Director)
  director!: Director;
}

describe('seed() builder', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Studio, Director, Film],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
  });

  describe('single entity', () => {
    it('create() returns an instance in memory', async () => {
      const director = await seed(Director).create();

      expect(director).toBeInstanceOf(Director);
      expect(typeof director.name).toBe('string');
      expect(director.id).toBeUndefined();
    });

    it('create() seeds relations by default', async () => {
      const director = await seed(Director).create();

      expect(director.films).toHaveLength(2);
      director.films.forEach((f) => expect(f).toBeInstanceOf(Film));
    });

    it('create() skips relations when relations: false', async () => {
      const director = await seed(Director).create({ relations: false });

      expect(director.films).toBeUndefined();
    });

    it('save() persists and assigns an id', async () => {
      const em = orm.em.fork();
      const director = await seed(Director).save({ em });

      expect(director).toBeInstanceOf(Director);
      expect(director.id).toBeGreaterThan(0);
    });

    it('createMany() returns the requested number of instances', async () => {
      const directors = await seed(Director).createMany(3);

      expect(directors).toHaveLength(3);
      directors.forEach((d) => expect(d).toBeInstanceOf(Director));
    });

    it('saveMany() persists all instances', async () => {
      const em = orm.em.fork();
      const directors = await seed(Director).saveMany(3, { em });

      expect(directors).toHaveLength(3);
      directors.forEach((d) => expect(d.id).toBeGreaterThan(0));
    });
  });

  describe('values — post-seed overrides', () => {
    it('create() overrides a @Seed-decorated property', async () => {
      const director = await seed(Director).create({ values: { name: 'Override' } });

      expect(director.name).toBe('Override');
    });

    it('create() sets a property with no @Seed decorator', async () => {
      const director = await seed(Director).create({ values: { id: 999 } });

      expect(director.id).toBe(999);
    });

    it('createMany() applies the same values to every instance', async () => {
      const directors = await seed(Director).createMany(3, { values: { name: 'Same' } });

      expect(directors).toHaveLength(3);
      directors.forEach((d) => expect(d.name).toBe('Same'));
    });

    it('save() persists the overridden value', async () => {
      const em = orm.em.fork();
      const saved = await seed(Director).save({ em, values: { name: 'Persisted' } });

      const fetched = await orm.em.fork().findOneOrFail(Director, { id: saved.id });

      expect(fetched.name).toBe('Persisted');
    });

    it('saveMany() applies values to all persisted instances', async () => {
      const em = orm.em.fork();
      const saved = await seed(Director).saveMany(3, { em, values: { name: 'Shared' } });

      const ids = saved.map((d) => d.id);
      const fetched = await orm.em.fork().find(Director, { id: { $in: ids } });

      expect(fetched).toHaveLength(3);
      fetched.forEach((d) => expect(d.name).toBe('Shared'));
    });

    it('createMany() calls a factory value once per instance', async () => {
      let counter = 0;
      const directors = await seed(Director).createMany(3, {
        values: { name: () => `Director ${++counter}` },
      });

      expect(directors.map((d) => d.name)).toEqual(['Director 1', 'Director 2', 'Director 3']);
    });

    it('saveMany() calls a factory value once per persisted instance', async () => {
      let counter = 0;
      const em = orm.em.fork();
      const saved = await seed(Director).saveMany(3, {
        em,
        values: { name: () => `Director ${++counter}` },
      });

      const ids = saved.map((d) => d.id);
      const fetched = await orm.em.fork().find(Director, { id: { $in: ids } });

      expect(fetched.map((d) => d.name).sort()).toEqual(['Director 1', 'Director 2', 'Director 3']);
    });
  });

  describe('self — partial entity in factory', () => {
    it('receives the partially-built entity so later properties can depend on earlier ones', async () => {
      class Event {
        @Seed(() => faker.date.past())
        @Property()
        beginDate!: Date;

        @Seed((_, self: Event) => faker.date.future({ refDate: self.beginDate }))
        @Property()
        endDate!: Date;
      }

      const event = await seed(Event).create({ relations: false });

      expect(event.endDate > event.beginDate).toBe(true);
    });
  });

  describe('array form', () => {
    it('create() returns a tuple of instances', async () => {
      const [director, studio] = await seed([Director, Studio]).create();

      expect(director).toBeInstanceOf(Director);
      expect(studio).toBeInstanceOf(Studio);
    });

    it('create() skips relations by default', async () => {
      const [director] = await seed([Director, Studio]).create();

      expect(director.films).toBeUndefined();
    });

    it('create() seeds relations when relations: true', async () => {
      const [director] = await seed([Director, Studio]).create({ relations: true });

      expect(director.films).toHaveLength(2);
    });

    it('save() persists each entity independently', async () => {
      const em = orm.em.fork();
      const [director, studio] = await seed([Director, Studio]).save({ em });

      expect(director.id).toBeGreaterThan(0);
      expect(studio.id).toBeGreaterThan(0);
    });

    it('createMany() returns arrays of instances per class', async () => {
      const [directors, studios] = await seed([Director, Studio]).createMany(3);

      expect(directors).toHaveLength(3);
      expect(studios).toHaveLength(3);
      directors.forEach((d) => expect(d).toBeInstanceOf(Director));
      studios.forEach((s) => expect(s).toBeInstanceOf(Studio));
    });

    it('saveMany() persists all instances per class', async () => {
      const em = orm.em.fork();
      const [directors, studios] = await seed([Director, Studio]).saveMany(3, { em });

      expect(directors).toHaveLength(3);
      expect(studios).toHaveLength(3);
      directors.forEach((d) => expect(d.id).toBeGreaterThan(0));
      studios.forEach((s) => expect(s.id).toBeGreaterThan(0));
    });
  });
});
