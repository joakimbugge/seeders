import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Seed, create, createMany } from '../../src';

@Embeddable()
class Address {
  @Seed(() => faker.location.streetAddress())
  @Property()
  street!: string;

  @Seed(() => faker.location.city())
  @Property()
  city!: string;

  @Seed(() => faker.location.countryCode())
  @Property()
  country!: string;
}

@Entity()
class Customer {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.company.name())
  @Property()
  name!: string;

  // No @Seed here — the seeder detects this via MikroORM embedded metadata.
  @Embedded(() => Address)
  address!: Address;
}

describe('embedded entities', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Customer],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
  });

  it('auto-seeds an embedded class without @Seed on the parent property', async () => {
    const customer = await create(Customer);

    expect(customer.address).toBeDefined();
    expect(typeof customer.address.street).toBe('string');
    expect(typeof customer.address.city).toBe('string');
    expect(typeof customer.address.country).toBe('string');
  });

  it('persists the embedded columns to the database', async () => {
    const em = orm.em.fork();
    const customer = await create(Customer);
    em.persist(customer);
    await em.flush();

    const fetched = await orm.em.fork().findOneOrFail(Customer, { id: customer.id });

    expect(fetched.address.street).toBe(customer.address.street);
    expect(fetched.address.city).toBe(customer.address.city);
    expect(fetched.address.country).toBe(customer.address.country);
  });

  it('each seeded instance gets an independently generated address', async () => {
    const em = orm.em.fork();
    const [a, b] = await createMany(Customer, { count: 2 });
    em.persist([a, b]);
    await em.flush();

    expect(a.id).not.toBe(b.id);
    expect(a.address).not.toBe(b.address);
  });
});
