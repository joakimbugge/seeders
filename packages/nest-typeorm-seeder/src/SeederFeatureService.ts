import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { SeederCtor } from './SeederModule.js';
import { SeederRegistry } from './SeederRegistry.js';

export const FEATURE_SEEDERS_TOKEN = Symbol('FEATURE_SEEDERS_TOKEN');

@Injectable()
export class SeederFeatureService implements OnModuleInit {
  constructor(
    @Inject(FEATURE_SEEDERS_TOKEN) private readonly seeders: SeederCtor[],
    private readonly registry: SeederRegistry,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.seeders);
  }
}
