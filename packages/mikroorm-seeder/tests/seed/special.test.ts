import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Seed, create, save } from '../../src';

@Entity()
class Department {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.commerce.department())
  @Property()
  name!: string;

  @Seed()
  @ManyToOne(() => Department, { nullable: true })
  manager?: Department;

  @OneToMany(() => Department, (d) => d.manager)
  reports!: Department[];
}

describe('self-referencing relation (adjacent list without @Tree)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Department],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
  });

  it('creates an entity — manager seeded one level deep, manager.manager cut by ancestor guard', async () => {
    const dept = await create(Department);

    expect(dept.name).toBeTruthy();
    expect(dept.manager).toBeInstanceOf(Department);
    expect(dept.manager!.manager).toBeUndefined();
  });

  it('saves an entity to the database', async () => {
    const em = orm.em.fork();
    const dept = await save(Department, { em, relations: false });

    expect(dept.id).toBeGreaterThan(0);
    expect(dept.name).toBeTruthy();
  });
});
