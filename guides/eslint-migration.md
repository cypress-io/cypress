# ESLint Migration Guide: Monorepo Alignment

## Migration Checklist

### Batch 1: Small npm utilities
- [ ] npm/grep
- [ ] npm/puppeteer
- [ ] npm/mount-utils
- [ ] npm/cypress-schematic

### Batch 2: Framework adapters
- [ ] npm/react
- [ ] npm/vue
- [ ] npm/svelte

### Batch 3: Build-related
- [ ] npm/webpack-batteries-included-preprocessor
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
- [ ] packages/server

### Batch 4b: Core packages (part 2)
- [ ] packages/runner
- [ ] packages/extension
- [ ] packages/graphql
- [ ] packages/network
- [ ] packages/socket
- [ ] packages/telemetry
- [ ] packages/launchpad
- [ ] packages/errors
- [ ] packages/data-context
- [ ] packages/app

### Batch 4c: Core packages (part 3)
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

### 1. **Batch Packages for Migration**
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
4. **Run lint and autofix:**
   - From the package root, run:
     ```
     npx eslint . --ext .js,.ts,.tsx,.jsx --fix
     ```
   - Manually fix any remaining lint errors.
5. **Verify TypeScript configuration:**
   - Ensure the package has a valid `tsconfig.json` that works with the new ESLint config.
   - Run `npx tsc --noEmit` to check for TypeScript compilation errors.
   - Verify that the new ESLint config can properly parse TypeScript files in the package.
6. **Run tests for the package** to ensure nothing broke.
7. **Commit changes** with a clear message, e.g.:
   ```
   chore(npm/grep): migrate to @packages/eslint-config and remove legacy eslint-plugin-dev
   ```

### 3. **Open a PR for Each Batch**
- Keep each migration PR focused (one batch per PR).
- List all affected packages in the PR description.
- Include a checklist for each package:
  - [ ] Removed old ESLint config
  - [ ] Added new config
  - [ ] Ran lint and fixed errors
  - [ ] Ran tests

### 4. **Document Issues or Gaps**
- If you hit any missing rules or plugin gaps, note them for follow-up.
- If a package needs a custom override, add it in a local `eslint.config.ts` (prefer to upstream to the shared config if possible).

### 5. **Deprecate and Remove Old Plugin**
- Once all packages are migrated, remove `@cypress/eslint-plugin-dev` from the repo and CI.

### 6. **Update Lerna/Monorepo Config**
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

## Tips
- Use a tracking issue or project board to coordinate and document progress.
- If a package is especially noisy, consider splitting it into its own PR.
- Communicate with the team about the migration timeline and process.

---

**Happy linting!** 