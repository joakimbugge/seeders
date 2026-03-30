import 'reflect-metadata';
import { Seeder } from '../../../src/index.js';
import type { SeederInterface } from '../../../src/index.js';
import type { SeedContext } from '../../../src/index.js';

@Seeder()
export class FixtureBookSeeder implements SeederInterface {
  async run(_ctx: SeedContext): Promise<void> {}
}
