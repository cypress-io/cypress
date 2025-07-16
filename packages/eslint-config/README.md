# @packages/eslint-config

A comprehensive ESLint configuration package for the Cypress monorepo, providing standardized linting rules across JavaScript, TypeScript, React, Vue, and Cypress test files.

## Overview

This package provides a unified ESLint configuration that combines multiple popular ESLint plugins and configurations to ensure consistent code quality across the entire Cypress codebase.

## Features

### Supported File Types
- **JavaScript/TypeScript**: `.js`, `.ts`, `.jsx`, `.tsx`
- **Vue**: `.vue` files
- **Cypress Tests**: `.cy.js`, `.cy.ts`
- **GraphQL**: `.graphql` files
- **Configuration Files**: `vite.config.mjs`, `webpack.config.*`

### Included Configurations
- **Base ESLint**: `@eslint/js` recommended rules
- **TypeScript**: `typescript-eslint` recommended rules with project service
- **Cypress**: `eslint-plugin-cypress` recommended rules
- **Mocha**: `eslint-plugin-mocha` recommended rules for testing
- **Vue**: `eslint-plugin-vue` recommended rules
- **React**: `eslint-plugin-react` recommended rules (React 18+)
- **Stylistic**: `@stylistic/eslint-plugin` with custom formatting rules
- **Import**: `eslint-plugin-import-x` for import/export validation
- **GraphQL**: `@graphql-eslint/eslint-plugin` for GraphQL files

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
Many rules are currently disabled during ESLint development but should eventually be enabled:
- TypeScript-specific rules (`@typescript-eslint/*`)
- Mocha testing rules
- Vue component rules
- Cypress-specific rules
- React rules (set to warn)

## Usage

### Installation
This package is private and intended for internal use within the Cypress monorepo.

### Basic Setup
```typescript
// eslint.config.ts
import baseConfig from '@packages/eslint-config'

export default baseConfig
```

### With Custom Overrides
```typescript
// eslint.config.ts
import baseConfig from '@packages/eslint-config'

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

## Environment-Specific Configurations

### Browser Environment
Files with extensions `.cy.{js,ts}`, `.{j,t}sx`, and `.vue` automatically get browser globals.

### Node.js Environment
Configuration files like `vite.config.mjs` and `webpack.config.*` get Node.js globals.

### Mixed Environment
The base configuration includes shared Node.js and browser globals, plus ES2020 features.

## Ignored Files
The configuration automatically ignores:
- `.releaserc.js`
- `dist/**/*`
- `**/__snapshots__/**/*`
- `test/.mocharc.js`

## Development

### Scripts
- `npm run lint`: Lint the package itself

### Dependencies
This package includes all necessary ESLint plugins and parsers as devDependencies, ensuring consistent versions across the monorepo.

## Notes

- This configuration is designed for the Cypress monorepo and may need adjustments for other projects
- Many rules are temporarily disabled to avoid large diffs during development
- The configuration uses the new flat config format (ESLint 9+)
- TypeScript project service is enabled for better type-aware linting 