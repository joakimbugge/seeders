import 'reflect-metadata';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Seed } from '../../../src/index.js';

@Entity()
export class FixtureAuthor {
  @PrimaryKey()
  id!: number;

  @Seed(() => 'fixture-author')
  @Property()
  name!: string;
}
