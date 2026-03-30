import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Seed, create } from '../../src';

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: { car: 'Car', truck: 'Truck' },
})
class Vehicle {
  @PrimaryKey()
  id!: number;

  @Seed(() => faker.vehicle.manufacturer())
  @Property()
  make!: string;

  @Seed(() => faker.vehicle.model())
  @Property()
  model!: string;
}

@Entity({ discriminatorValue: 'car' })
class Car extends Vehicle {
  @Seed(() => faker.number.int({ min: 2, max: 6 }))
  @Property({ nullable: true })
  doors!: number;
}

@Entity({ discriminatorValue: 'truck' })
class Truck extends Vehicle {
  @Seed(() => faker.number.float({ min: 0.5, max: 5.0, fractionDigits: 1 }))
  @Property({ nullable: true })
  payloadTons!: number;
}

describe('entity inheritance', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Vehicle, Car, Truck],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close();
  });

  it('seeds inherited parent properties alongside child properties', async () => {
    const car = await create(Car);

    expect(typeof car.make).toBe('string');
    expect(typeof car.model).toBe('string');
    expect(typeof car.doors).toBe('number');
    expect(car.doors).toBeGreaterThanOrEqual(2);
  });

  it('persists a child entity including inherited columns', async () => {
    const em = orm.em.fork();
    const car = await create(Car);
    em.persist(car);
    await em.flush();

    expect(car.id).toBeGreaterThan(0);
    expect(typeof car.make).toBe('string');
    expect(typeof car.doors).toBe('number');
  });

  it('different child types share the same table but seed independently', async () => {
    const em = orm.em.fork();
    const car = await create(Car);
    const truck = await create(Truck);
    em.persist([car, truck]);
    await em.flush();

    const all = await orm.em.fork().find(Vehicle, {});
    const ids = all.map((v) => v.id);
    expect(ids).toContain(car.id);
    expect(ids).toContain(truck.id);
  });

  it('child-only properties are not present on sibling child instances', async () => {
    const car = await create(Car);
    const truck = await create(Truck);

    expect((car as unknown as Truck).payloadTons).toBeUndefined();
    expect((truck as unknown as Car).doors).toBeUndefined();
  });
});
