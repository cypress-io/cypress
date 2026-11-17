# @packages/eslint-config

A comprehensive ESLint configuration package for the Cypress monorepo, providing standardized linting rules across JavaScript, TypeScript, React, Vue, and Cypress test files.

## Overview

This package provides a unified ESLint configuration that combines multiple popular ESLint plugins and configurations to ensure consistent code quality across the entire Cypress codebase.

## Features

### Supported File Types
- **JavaScript/TypeScript**: `.js`, `.ts`, `.jsx`, `.tsx`
- **Vue**: `.vue` files
- **Cypress Tests**: `.cy.js`, `.cy.ts`
- **GraphQL**: `gql` template literals, opt-in via `graphqlConfig`
- **Configuration Files**: `vite.config.mjs`, `webpack.config.*`
- **JSON**: `.json` files, opt-in via `jsonConfig`

### Included Configurations
- **Base ESLint**: `@eslint/js` recommended rules
- **TypeScript**: `typescript-eslint` recommended rules with project service
- **Cypress**: `eslint-plugin-cypress` recommended rules
- **Mocha**: `eslint-plugin-mocha` recommended rules for testing
- **Vue**: `eslint-plugin-vue` recommended rules
- **React**: `eslint-plugin-react` recommended rules (React 18+)
- **Stylistic**: `@stylistic/eslint-plugin` with custom formatting rules
- **Import**: `eslint-plugin-import-x` for import/export validation
- **GraphQL**: `@graphql-eslint/eslint-plugin` for `gql` template literals, opt-in via `graphqlConfig`

## Key Rules and Customizations

### Stylistic Rules
- **Brace Style**: 1tbs (one true brace style)
- **Arrow Parens**: Always required
- **Function Parens**: Space before function parentheses
- **Comma Dangle**: Always multiline
- **Indentation**: Disabled (inconsistent across codebase)

### Code Quality Rules
- **Console**: `no-console` is an error
- **Restricted Properties**: Warns against problematic Node.js APIs
- **Synchronous FS**: Warns against sync file system calls
- **Padding**: Enforces blank lines between statements

### Temporarily Disabled Rules
Some recommended rules are turned off because the codebase still has many violations. They are the rules set to `off` in the "gold standard, but have many violations" block of [`src/baseConfig.ts`](./src/baseConfig.ts):
- Core rules: `prefer-rest-params`, `no-async-promise-executor`
- TypeScript-specific rules (`@typescript-eslint/*`)
- Mocha testing rules (`mocha/no-exclusive-tests` stays an error)
- Vue component rules
- Cypress-specific rules

Re-enabling them, one rule or a small group at a time, is tracked in [cypress-io/cypress#35250](https://github.com/cypress-io/cypress/issues/35250). `react/react-in-jsx-scope` and `react/jsx-uses-react` are also off in that block, but for good: they don't apply to React 18's JSX transform.

## Usage

### Installation
This package is private and intended for internal use within the Cypress monorepo.

### Basic Setup
The configs are named exports; the package has no default export.

```typescript
// eslint.config.ts
import { baseConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
]
```

### With Custom Overrides
```typescript
// eslint.config.ts
import { baseConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  {
    // Your custom overrides here
    rules: {
      'no-console': 'warn', // Override to warn instead of error
    },
  },
]
```

### With JSON Linting
```typescript
// eslint.config.ts
import { baseConfig, jsonConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...jsonConfig,
]
```

`jsonConfig` enforces two-space JSON layout, `package.json` key order and sorted `scripts` and dependency maps, using `eslint-plugin-jsonc` and `eslint-plugin-package-json`. See [`jsonConfig`](./AGENTS.md#jsonconfig).

### With GraphQL Linting

```typescript
// eslint.config.ts
import { baseConfig, graphqlConfig } from '@packages/eslint-config'

export default [
  ...baseConfig,
  ...graphqlConfig(),
]
```

`graphqlConfig()` validates `gql` template literals in `.js`, `.ts`, `.jsx`, `.tsx` and `.vue` files against `packages/data-context/schemas/schema.graphql`. Only `app`, `launchpad`, `frontend-shared` and `data-context` use it. See [`graphqlConfig`](./AGENTS.md#graphqlconfig).

## Environment-Specific Configurations

### Browser Environment
Files with extensions `.cy.{js,ts}`, `.{j,t}sx`, and `.vue` automatically get browser globals.

### Node.js Environment
Configuration files like `vite.config.mjs` and `webpack.config.*` get Node.js globals.

### Mixed Environment
The base configuration includes shared Node.js and browser globals, plus ES2020 features.

## Ignored Files
The configuration automatically ignores these paths, relative to each workspace's root:
- `.releaserc.js`
- `cjs/**/*`
- `dist/**/*`
- `esm/**/*`
- `**/__snapshots__/**/*`
- `test/.mocharc.js`

## Development

### Scripts
- `npm run lint`: Lint the package itself

### Dependencies
This package includes all necessary ESLint plugins and parsers as devDependencies, ensuring consistent versions across the monorepo.

## Notes

- This configuration is designed for the Cypress monorepo and may need adjustments for other projects
- Some recommended rules stay off until their existing violations are fixed; see [Temporarily Disabled Rules](#temporarily-disabled-rules)
- The configuration uses the new flat config format (ESLint 10+)
- TypeScript project service is enabled for better type-aware linting 