import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { Column, DataSource, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type {
  CreateManyOptions,
  CreateOptions,
  SaveManyOptions,
  SaveOptions,
  SeedContext,
} from './index.js';
import { create, createMany, save, saveMany, Seed, seed } from './index.js';

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

@Entity()
class Author {
  @PrimaryGeneratedColumn()
  id!: number;

  @Seed(() => faker.person.fullName())
  @Column({ type: 'text' })
  name!: string;

  @Seed({ count: 2 })
  @OneToMany(() => Book, (b) => b.author)
  books!: Book[];
}

@Entity()
class Book {
  @PrimaryGeneratedColumn()
  id!: number;

  @Seed(() => faker.lorem.words(4))
  @Column({ type: 'text' })
  title!: string;

  @Seed()
  @ManyToOne(() => Author, (a) => a.books)
  author!: Author;
}

// ---------------------------------------------------------------------------
// DataSource
// ---------------------------------------------------------------------------

const dataSource = new DataSource({
  type: 'better-sqlite3',
  database: ':memory:',
  synchronize: true,
  logging: false,
  entities: [Author, Book],
});

// ---------------------------------------------------------------------------
// Builder API — single class
// ---------------------------------------------------------------------------

// create(): Author
const author = await seed(Author).create();

// create() with options
const authorWithOptions: Author = await seed(Author).create({ relations: false });

// create() with values
const authorWithValues: Author = await seed(Author).create({ values: { name: 'Alice' } });

// createMany(): Author[]
const authors: Author[] = await seed(Author).createMany(3);

// createMany() with values (same values applied to all)
const namedAuthors: Author[] = await seed(Author).createMany(3, { values: { name: 'Bob' } });

// save(): Author — requires dataSource
const savedAuthor: Author = await seed(Author).save({ dataSource });

// save() with values
const savedWithValues: Author = await seed(Author).save({ dataSource, values: { name: 'Carol' } });

// saveMany(): Author[]
const savedAuthors: Author[] = await seed(Author).saveMany(3, { dataSource });

// saveMany() with values
const savedNamed: Author[] = await seed(Author).saveMany(3, {
  dataSource,
  values: { name: 'Dave' },
});

// ---------------------------------------------------------------------------
// Builder API — array form (relations disabled by default)
// ---------------------------------------------------------------------------

// create(): [Author, Book]
const [a, b] = await seed([Author, Book]).create();

// create() with relations enabled
const [a2, b2] = await seed([Author, Book]).create({ relations: true });

// createMany(): [Author[], Book[]]
const [manyAuthors, manyBooks] = await seed([Author, Book]).createMany(3);

// save(): [Author, Book]
const [savedA, savedB] = await seed([Author, Book]).save({ dataSource });

// saveMany(): [Author[], Book[]]
const [savedAs, savedBs] = await seed([Author, Book]).saveMany(3, { dataSource });

// ---------------------------------------------------------------------------
// Direct API — create / createMany
// ---------------------------------------------------------------------------

// create() with CreateOptions<T>
const createOpts: CreateOptions<Author> = { relations: false, values: { name: 'Eve' } };
const directAuthor: Author = await create(Author, createOpts);

// create() with no options
const bareAuthor: Author = await create(Author);

// create() — array form, returns [Author, Book]
const [da, db] = await create([Author, Book]);

// createMany() with CreateManyOptions<T>
const createManyOpts: CreateManyOptions<Author> = { count: 5, values: { name: 'Frank' } };
const directAuthors: Author[] = await createMany(Author, createManyOpts);

// createMany() — array form, returns [Author[], Book[]]
const [das, dbs] = await createMany([Author, Book], { count: 3 });

// ---------------------------------------------------------------------------
// Direct API — save / saveMany
// ---------------------------------------------------------------------------

// save() with SaveOptions<T>
const saveOpts: SaveOptions<Author> = { dataSource, values: { name: 'Grace' } };
const directSaved: Author = await save(Author, saveOpts);

// save() — array form, returns [Author, Book]
const [sa, sb] = await save([Author, Book], { dataSource });

// saveMany() with SaveManyOptions<T>
const saveManyOpts: SaveManyOptions<Author> = { dataSource, count: 5, values: { name: 'Hank' } };
const directSavedMany: Author[] = await saveMany(Author, saveManyOpts);

// saveMany() — array form, returns [Author[], Book[]]
const [sas, sbs] = await saveMany([Author, Book], { count: 3, dataSource });

// ---------------------------------------------------------------------------
// SeedContext passed through factories
// ---------------------------------------------------------------------------

// dataSource is forwarded to factory callbacks via SeedContext
@Entity()
class Tagged {
  @PrimaryGeneratedColumn()
  id!: number;

  @Seed(async ({ dataSource: ds }) => {
    if (!ds) {
      return 'default-tag';
    }
    const existing = await ds.getRepository(Tagged).findOneBy({ tag: 'special' });
    return existing ? 'duplicate' : 'special';
  })
  @Column({ type: 'text' })
  tag!: string;
}

await dataSource.destroy();
