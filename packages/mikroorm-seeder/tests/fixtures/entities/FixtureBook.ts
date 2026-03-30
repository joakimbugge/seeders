import 'reflect-metadata';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Seed } from '../../../src/index.js';

@Entity()
export class FixtureBook {
  @PrimaryKey()
  id!: number;

  @Seed(() => 'fixture-book')
  @Property()
  title!: string;
}
