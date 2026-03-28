import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { FixtureAuthor } from '../entities/FixtureAuthor.js';
import { FixtureBook } from '../entities/FixtureBook.js';

export default new DataSource({
  type: 'better-sqlite3',
  database: ':memory:',
  synchronize: true,
  logging: false,
  entities: [FixtureAuthor, FixtureBook],
});
