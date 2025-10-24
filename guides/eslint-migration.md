# ESLint Migration Guide: Monorepo Alignment

## Migration Checklist

### Batch 1: Small npm utilities
- [x] npm/grep ✅ **COMPLETED** 
- [x] npm/puppeteer ✅ **COMPLETED** 
- [x] npm/mount-utils ✅ **COMPLETED** 
- [x] npm/cypress-schematic ✅ **COMPLETED** 

### Batch 2: Framework adapters
- [ ] npm/react
- [ ] npm/vue
- [ ] npm/svelte

### Batch 3: Build-related
- [x] npm/webpack-batteries-included-preprocessor
- [ ] npm/webpack-preprocessor
- [ ] npm/webpack-dev-server
- [ ] npm/vite-plugin-cypress-esm
- [ ] npm/vite-dev-server

### Batch 4a: Core packages (part 1)
- [ ] packages/frontend-shared
- [ ] packages/icons
- [ ] packages/launcher
- [ ] packages/https-proxy
- [ ] packages/proxy
- [ ] packages/net-stubbing
- [ ] packages/driver
- [ ] packages/rewriter
- [ ] packages/reporter
- [x] packages/server

### Batch 4b: Core packages (part 2)
- [ ] packages/runner
- [ ] packages/extension
- [ ] packages/network
- [ ] packages/socket
- [ ] packages/telemetry
- [ ] packages/launchpad
- [x] packages/errors
- [ ] packages/data-context
- [ ] packages/app

### Batch 4c: Core packages (part 3)
- [x] cli
- [ ] packages/config
- [ ] packages/root
- [ ] packages/resolve-dist
- [ ] packages/packherd-require
- [ ] packages/v8-snapshot-require
- [ ] packages/web-config
- [ ] packages/types
- [ ] packages/example

### Batch 5: Test and script folders
- [ ] system-tests
- [ ] scripts

---

This guide describes how to migrate all packages in the Cypress monorepo to the new unified ESLint configuration (`@packages/eslint-config`).

---

## Why Migrate?
- **Consistency:** Enforce the same linting rules and plugins across all packages.
- **Simplicity:** Remove the need for custom plugins like `@cypress/eslint-plugin-dev`.
- **Maintainability:** Make it easier to update and maintain lint rules.
- **Modernization:** Replace obsolete TSLint with the appropriate ESLint TypeScript plugin (`@typescript-eslint`).

---

## Migration Strategy

### 1. **Lint-Staged Configuration**
During the migration period, the root `package.json` uses explicit lint-staged patterns to ensure each package gets the correct linting treatment:

- **Migrated packages** (like `npm/grep`): Use `yarn lint:fix` which runs ESLint from the package directory with the correct config
- **Non-migrated packages**: Use `eslint --fix` which runs from the root with the root config
- **Root files**: Covered by `*.{js,jsx,ts,tsx,json,eslintrc,vue}` pattern

This configuration will be simplified once all packages are migrated to the unified ESLint setup.

### 2. **Batch Packages for Migration**
- **Batch by directory/type** to keep PRs manageable and reduce risk.
- **Batch size:** 4–8 packages per PR, grouped by similarity.

### 2. **Migration Steps for Each Package**

For each package in the batch:

1. **Remove old ESLint config and plugin references:**
   - Delete `.eslintrc`, `.eslintrc.json`, or `.eslintrc.js` in the package.
   - Remove any references to `@cypress/eslint-plugin-dev` in `package.json` (if present).
   - **Remove TSLint configs:** Delete `tslint.json` and remove `tslint` dependencies from `package.json`.
2. **Add a new ESLint config file:**
   - Create `eslint.config.ts` in the package root:
     ```ts
     import baseConfig from '@packages/eslint-config'
     export default baseConfig
     ```
3. **Ensure dependencies are up to date:**
   - Remove any package-local ESLint plugins now provided by the shared config.
   - Remove TSLint-related dependencies (the new config includes `@typescript-eslint`).
   - **Add the shared ESLint config as a dev dependency:**
     - In each migrated package, add `@packages/eslint-config` to `devDependencies` (use a relative file path if not published to npm).
   - **Add ESLint as a dev dependency:**
     - Since `@packages/eslint-config` has ESLint as a peer dependency, add `eslint: "^9.18.0"` to `devDependencies`.
4. **Add lint-staged configuration:**
   - Add a `lint-staged` section to the package's `package.json`:
     ```json
     {
       "lint-staged": {
         "**/*.{js,jsx,ts,tsx}": "eslint --fix"
       }
     }
     ```
   - This ensures that when files are staged for commit, they are automatically linted and fixed using the package's local ESLint configuration.
5. **Run lint and autofix:**
   - From the package root, run:
     ```
     npx eslint . --ext .js,.ts,.tsx,.jsx --fix
     ```
   - Manually fix any remaining lint errors.
6. **Verify TypeScript configuration:**
   - Ensure the package has a valid `tsconfig.json` that works with the new ESLint config.
   - Run `npx tsc --noEmit` to check for TypeScript compilation errors.
   - Verify that the new ESLint config can properly parse TypeScript files in the package.
7. **Run tests for the package** to ensure nothing broke.
8. **Commit changes** with a clear message, e.g.:
   ```
   chore(npm/grep): migrate to @packages/eslint-config and remove legacy eslint-plugin-dev
   ```

### 4. **Open a PR for Each Batch**
- Keep each migration PR focused (one batch per PR).
- List all affected packages in the PR description.
- Include a checklist for each package:
  - [ ] Removed old ESLint config
  - [ ] Added new config
  - [ ] Added lint-staged configuration
  - [ ] Ran lint and fixed errors
  - [ ] Ran tests

### 5. **Document Issues or Gaps**
- If you hit any missing rules or plugin gaps, note them for follow-up.
- If a package needs a custom override, add it in a local `eslint.config.ts` (prefer to upstream to the shared config if possible).

### 6. **Deprecate and Remove Old Plugin**
- Once all packages are migrated, remove `@cypress/eslint-plugin-dev` from the repo and CI.

### 7. **Simplify Lint-Staged Configuration**
After all packages are migrated, simplify the lint-staged configuration in root `package.json`:

```json
{
  "lint-staged": {
    "**/*.{js,jsx,ts,tsx,json,eslintrc,vue}": "eslint --fix",
  }
}
```

### 8. **Update Lerna/Monorepo Config**
- Ensure all packages reference the new config in their `package.json`/`eslint.config.ts`.
- Update documentation and developer onboarding guides.

---

## Example: Migrating a Batch

1. **Select batch:** e.g., `npm/grep`, `npm/puppeteer`, `npm/mount-utils`, `npm/cypress-schematic`
2. **For each package:**
   - Remove `.eslintrc*` files
   - Add `eslint.config.ts` as above
   - Remove local plugin deps
   - Run lint and fix errors
   - Run tests
3. **Commit and open PR**

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. **Jiti Version Compatibility Error**
**Error:** `Error: You are using an outdated version of the 'jiti' library. Please update to the latest version of 'jiti' to ensure compatibility and access to the latest features.`

**Solution:**
- Add `jiti: "^2.4.2"` to the package's `devDependencies`
- ESLint 9.x requires jiti >= 2.2.0, but monorepo dependencies might provide older versions

#### 2. **TypeScript Project Service Errors**
**Error:** `was not found by the project service. Consider either including it in the tsconfig.json or including it in allowDefaultProject`

**Solutions:**
- **Create/update `tsconfig.json`** that extends the base config:
  ```json
  {
    "extends": "../../packages/ts/tsconfig.json",
    "compilerOptions": {
      "esModuleInterop": true,
      "allowJs": true,
      "checkJs": false
    },
    "include": [
      "src/**/*",
      "cypress/**/*",
      "*.js",
      "*.ts",
      "*.jsx",
      "*.tsx"
    ],
    "exclude": ["node_modules", "dist"]
  }
  ```
- **For Cypress packages**, ensure `cypress/tsconfig.json` includes all test files:
  ```json
  {
    "compilerOptions": {
      "types": ["cypress"]
    },
    "include": [
      "**/*.ts",
      "**/*.js"
    ]
  }
  ```
- **Add `allowDefaultProject: true`** to ESLint config for problematic files:
  ```ts
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        allowDefaultProject: true,
      },
    },
  }
  ```

#### 3. **Skip Comment Rule Violations**
**Error:** `@cypress/dev/skip-comment` rule violations for `it.skip()` tests

**Solution:**
- Replace `eslint-disable-next-line @cypress/dev/skip-comment` with proper explanatory comments:
  ```js
  // NOTE: This test is skipped for demonstration purposes
  it.skip('first test', () => {})
  ```

#### 4. **Rule Mismatches in Pre-commit Hook**
**Error:** ESLint rule violations that don't match the package's ESLint configuration (e.g., `Unexpected console statement` when `no-console` is off in package config)

**Root Cause:** Pre-commit hook runs ESLint from root directory using root-level config, not package-specific config

**Solution:**
- The root `package.json` now includes explicit lint-staged patterns for each package:
  ```json
  "lint-staged": {
    "npm/grep/**/*.{js,jsx,ts,tsx}": "yarn lint:fix",
    "*.{js,jsx,ts,tsx,json,eslintrc,vue}": "eslint --fix",
    "cli/**/*.{js,jsx,ts,tsx,json,eslintrc,vue}": "eslint --fix",
    "packages/**/*.{js,jsx,ts,tsx,json,eslintrc,vue}": "eslint --fix",
    // ... explicit patterns for each directory
  }
  ```
- **For migrated packages:** Use `yarn lint:fix` which runs the lerna command to execute ESLint from the package directory
- **For non-migrated packages:** Use `eslint --fix` which runs from the root with the root config
- **Note:** This verbose configuration is temporary during migration and will be simplified once all packages are migrated

#### 5. **ESLint Script Changes**
**Before ESLint 9.x:**
```json
"lint": "eslint . --ext .js,.ts"
```

**After ESLint 9.x:**
```json
"lint": "eslint"
```
ESLint 9.x auto-detects file extensions, so `--ext` flag is no longer needed.

#### 6. **Package Dependencies**
**Required additions to `package.json`:**
```json
{
  "devDependencies": {
    "@packages/eslint-config": "0.0.0-development",
    "eslint": "^9.18.0",
    "jiti": "^2.4.2"
  }
}
```

#### 7. **Custom Package Rules**
If a package needs custom rules, extend the base config:
```ts
import baseConfig from '@packages/eslint-config'

export default [
  ...baseConfig,
  {
    files: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
    rules: {
      'no-console': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['cypress/**/*.js', 'cypress/**/*.ts'],
    languageOptions: {
      globals: {
        Cypress: 'readonly',
        cy: 'readonly',
      },
    },
  },
]
```

### Migration Checklist Template

For each package, ensure you've completed:

- [ ] Removed `.eslintrc*` files
- [ ] Created `eslint.config.ts` with proper configuration
- [ ] Added required dependencies (`eslint`, `@packages/eslint-config`, `jiti`)
- [ ] Added lint-staged configuration to `package.json`
- [ ] Created/updated `tsconfig.json` that extends base config
- [ ] Updated ESLint scripts (removed `--ext` flag)
- [ ] Ran `yarn lint` successfully
- [ ] Ran tests to ensure nothing broke

---

## Tips
- Use a tracking issue or project board to coordinate and document progress.
- If a package is especially noisy, consider splitting it into its own PR.
- Communicate with the team about the migration timeline and process.
- **Test the pre-commit hook** before pushing to ensure lint-staged works correctly.

## Recent Updates
- **Fixed lint-staged configuration** to properly handle migrated vs non-migrated packages
- **Added explicit directory patterns** to ensure complete coverage during migration period

---

**Happy linting!** 