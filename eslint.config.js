// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const FEATURES = ['auth', 'scrutiny', 'territory', 'tracking'];

const crossFeaturePatternsFor = (feature) =>
  FEATURES.filter((other) => other !== feature).map((other) => ({
    group: [`@features/${other}`, `@features/${other}/*`, `**/features/${other}/**`],
    message: `Vertical Slicing (ADR-12): el feature "${feature}" no puede importar directamente del feature "${other}".`,
  }));

const DOMAIN_LAYER_PATTERNS = [
  {
    group: [
      '**/application/**',
      '**/infrastructure/**',
      '**/presentation/**',
      '@shared/infrastructure/**',
      '@shared/ui/**',
    ],
    message:
      'Clean Architecture: la capa domain no puede depender de application, infrastructure ni UI.',
  },
  {
    group: ['react', 'react-native', 'expo-*', '@supabase/*', '@sentry/*', '@tanstack/*'],
    message:
      'Clean Architecture: la capa domain debe ser TypeScript puro, sin frameworks ni SDKs externos.',
  },
];

const APPLICATION_LAYER_PATTERNS = [
  {
    group: [
      '**/infrastructure/**',
      '**/presentation/**',
      '@shared/infrastructure/**',
      '@shared/ui/**',
    ],
    message:
      'Clean Architecture: la capa application solo puede depender de contratos en domain, nunca de infrastructure ni UI.',
  },
  {
    group: ['react', 'react-native', 'expo-*', '@supabase/*', '@sentry/*', '@tanstack/*'],
    message:
      'Clean Architecture: los casos de uso no deben acoplarse a React, Expo ni SDKs de infraestructura.',
  },
];

const PRESENTATION_UI_PATTERNS = [
  {
    group: ['**/infrastructure/**', '@shared/infrastructure/**', '@supabase/*', '@sentry/*'],
    message:
      'Clean Architecture: las pantallas y componentes visuales no pueden importar directamente de infrastructure. Usa hooks de presentation.',
  },
];

const featureArchitectureRules = FEATURES.flatMap((feature) => {
  const crossFeature = crossFeaturePatternsFor(feature);

  return [
    // Aislamiento general del feature (infrastructure, presentation/hooks, etc.)
    {
      files: [`src/features/${feature}/**/*.{ts,tsx}`],
      rules: {
        'no-restricted-imports': ['error', { patterns: crossFeature }],
      },
    },
    // Domain dentro del feature: sin capas externas, sin SDKs y sin otros features
    {
      files: [`src/features/${feature}/domain/**/*.{ts,tsx}`],
      rules: {
        'no-restricted-imports': ['error', { patterns: [...crossFeature, ...DOMAIN_LAYER_PATTERNS] }],
      },
    },
    // Application dentro del feature: solo domain, sin infrastructure/UI/SDKs y sin otros features
    {
      files: [`src/features/${feature}/application/**/*.{ts,tsx}`],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [...crossFeature, ...APPLICATION_LAYER_PATTERNS] },
        ],
      },
    },
    // Componentes visuales del feature: sin infrastructure ni otros features
    {
      files: [`src/features/${feature}/presentation/components/**/*.{ts,tsx}`],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [...crossFeature, ...PRESENTATION_UI_PATTERNS] },
        ],
      },
    },
  ];
});

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },

  // 1. Reglas de Clean Architecture + Vertical Slicing por cada feature
  ...featureArchitectureRules,

  // 2. Shared Domain: 100% TypeScript puro
  {
    files: ['src/shared/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: DOMAIN_LAYER_PATTERNS }],
    },
  },

  // 3. Pantallas (src/app/**, excepto _layout.tsx que es Composition Root): sin infrastructure directa
  {
    files: ['src/app/**/*.{ts,tsx}'],
    ignores: ['src/app/_layout.tsx'],
    rules: {
      'no-restricted-imports': ['error', { patterns: PRESENTATION_UI_PATTERNS }],
    },
  },
]);
