import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'seeders',
  description: 'Decorator-based entity seeding for TypeORM and MikroORM',
  base: '/seeders/',

  themeConfig: {
    nav: [
      {
        text: 'TypeORM',
        items: [
          { text: 'Guide', link: '/guide/' },
          { text: 'NestJS', link: '/nest/' },
        ],
      },
      {
        text: 'MikroORM',
        items: [
          { text: 'Guide', link: '/mikroorm/' },
          { text: 'NestJS', link: '/nest-mikroorm/' },
        ],
      },
      {
        text: 'Core',
        items: [
          { text: 'Overview', link: '/seeder/' },
        ],
      },
      {
        text: 'API reference',
        items: [
          { text: 'seeder', link: '/api/seeder/' },
          { text: 'typeorm-seeder', link: '/api/typeorm-seeder/' },
          { text: 'nest-typeorm-seeder', link: '/api/nest-typeorm-seeder/' },
          { text: 'mikroorm-seeder', link: '/api/mikroorm-seeder/' },
          { text: 'nest-mikroorm-seeder', link: '/api/nest-mikroorm-seeder/' },
        ],
      },
    ],

    sidebar: {
      '/seeder/': [
        {
          text: 'seeder',
          items: [
            { text: 'Overview', link: '/seeder/' },
          ],
        },
      ],
      '/guide/': [
        {
          text: 'typeorm-seeder',
          items: [
            { text: 'Getting started', link: '/guide/' },
            { text: 'What is seeding?', link: '/guide/what-is-seeding' },
            { text: 'How it works', link: '/guide/how-it-works' },
            { text: 'Decorating entities', link: '/guide/decorating-entities' },
            { text: 'Seeding entities', link: '/guide/seeding-entities' },
          ],
        },
        {
          text: 'Advanced patterns',
          items: [
            { text: 'Tree entities', link: '/guide/advanced-patterns/tree-entities' },
            { text: 'Circular relations', link: '/guide/decorating-entities#circular-relations' },
            { text: 'Batch dependencies', link: '/guide/decorating-entities#depending-on-earlier-instances-in-a-batch' },
            { text: 'Depending on previous properties', link: '/guide/decorating-entities#depending-on-earlier-properties' },
          ],
        },
        {
          text: 'Organizing seeding logic',
          items: [
            { text: 'Seeder suites', link: '/guide/seeder-suites' },
            { text: 'Hooks', link: '/guide/hooks' },
            { text: 'Logging', link: '/guide/logging' },
          ],
        },
        {
          text: 'Running seeding',
          items: [
            { text: 'Running scripts', link: '/guide/running-scripts' },
            { text: 'CLI', link: '/guide/cli' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
            { text: 'API docs', link: '/api/typeorm-seeder/' },
          ],
        },
        {
          text: 'Frameworks',
          items: [
            { text: 'NestJS', link: '/nest/' },
          ],
        },
      ],
      '/nest/': [
        {
          text: 'nest-typeorm-seeder',
          items: [
            { text: 'Getting started', link: '/nest/' },
            { text: 'Feature modules', link: '/nest/feature-modules' },
            { text: 'Run once', link: '/nest/run-once' },
            { text: 'Seed scripts', link: '/nest/seed-scripts' },
            { text: 'Troubleshooting', link: '/nest/troubleshooting' },
          ],
        },
      ],
      '/mikroorm/': [
        {
          text: 'mikroorm-seeder',
          items: [
            { text: 'Getting started', link: '/mikroorm/' },
            { text: 'What is seeding?', link: '/guide/what-is-seeding' },
            { text: 'How it works', link: '/guide/how-it-works' },
            { text: 'Decorating entities', link: '/mikroorm/decorating-entities' },
            { text: 'Seeding entities', link: '/mikroorm/seeding-entities' },
          ],
        },
        {
          text: 'Advanced patterns',
          items: [
            { text: 'Circular relations', link: '/mikroorm/decorating-entities#circular-relations' },
            { text: 'Batch dependencies', link: '/mikroorm/decorating-entities#depending-on-earlier-instances-in-a-batch' },
            { text: 'Depending on previous properties', link: '/mikroorm/decorating-entities#depending-on-earlier-properties' },
          ],
        },
        {
          text: 'Organizing seeding logic',
          items: [
            { text: 'Seeder suites', link: '/mikroorm/seeder-suites' },
            { text: 'Hooks', link: '/mikroorm/hooks' },
            { text: 'Logging', link: '/mikroorm/logging' },
          ],
        },
        {
          text: 'Running seeding',
          items: [
            { text: 'Running scripts', link: '/mikroorm/running-scripts' },
            { text: 'CLI', link: '/mikroorm/cli' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
            { text: 'API docs', link: '/api/mikroorm-seeder/' },
          ],
        },
        {
          text: 'Frameworks',
          items: [
            { text: 'NestJS', link: '/nest-mikroorm/' },
          ],
        },
      ],
      '/nest-mikroorm/': [
        {
          text: 'nest-mikroorm-seeder',
          items: [
            { text: 'Getting started', link: '/nest-mikroorm/' },
            { text: 'Feature modules', link: '/nest-mikroorm/feature-modules' },
            { text: 'Run once', link: '/nest-mikroorm/run-once' },
            { text: 'Seed scripts', link: '/nest-mikroorm/seed-scripts' },
            { text: 'Troubleshooting', link: '/nest-mikroorm/troubleshooting' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/joakimbugge/seeders' }],

    search: { provider: 'local' },

    editLink: {
      pattern: 'https://github.com/joakimbugge/seeders/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
    },
  },
})
