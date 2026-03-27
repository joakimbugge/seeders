import { Injectable } from '@nestjs/common';
import type { SeederCtor } from './SeederModule.js';

@Injectable()
export class SeederRegistry {
  private readonly seeders: SeederCtor[] = [];

  register(seeders: SeederCtor[]): void {
    this.seeders.push(...seeders);
  }

  getAll(): SeederCtor[] {
    return this.seeders;
  }
}
