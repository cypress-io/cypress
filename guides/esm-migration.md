# ESM Migration Guide: Monorepo Alignment

## Migration Checklist

### Phase 1: Convert Packages to TypeScript

#### Criteria

- No require statements are to be used in `.ts` files
- Unit tests in package are written in TypeScript
- Does not include scripts or system test migrations

#### Status

##### NPM Packages

- [x] cli ✅ **COMPLETED** 
- [x] npm/angular ✅ **COMPLETED** 
- [x] npm/cypress-schematic ✅ **COMPLETED**
- [ ] npm/eslint-plugin-dev
- [x] npm/grep ✅ **COMPLETED** 
- [x] npm/mount-utils ✅ **COMPLETED**  
- [ ] npm/puppeteer **PARTIAL** 
- [x] npm/react ✅ **COMPLETED** 
- [x] npm/svelte ✅ **COMPLETED** 
- [x] npm/vite-dev-server ✅ **COMPLETED** 
- [x] vite-plugin-cypress-esm ✅ **COMPLETED** 
- [x] npm/vue ✅ **COMPLETED** 
- [ ] npm/webpack-batteries-included-preprocessor
- [x] npm/webpack-dev-server ✅ **COMPLETED** 
- [ ] npm/webpack-preprocessor **PARTIAL** 

##### Binary Packages

- [ ] packages/app **PARTIAL** - low priority: frontend package
- [ ] packages/config **PARTIAL** - entry point is JS
- [ ] packages/data-context  **PARTIAL** - entry point is JS
- [x] packages/driver ✅ **COMPLETED** - source complete, cypress tests need migration
- [x] packages/electron ✅ **COMPLETED**
- [ ] packages/error **PARTIAL** - entry point is JS
- [x] packages/eslint-config ✅ **COMPLETED**
- [ ] packages/example
- [ ] packages/extension
- [ ] packages/frontend-shared **PARTIAL** - entry point is JS
- [ ] packages/https-proxy - higher priority
- [x] packages/electron ✅ **COMPLETED**
- [ ] packages/https-proxy **PARTIAL** - entry point is JS
- [x] packages/icons ✅ **COMPLETED**
- [x] packages/launcher ✅ **COMPLETED**
- [x] packages/launchpad ✅ **COMPLETED**
- [x] packages/net-stubbing ✅ **COMPLETED**
- [ ] packages/network **PARTIAL** - entry point is JS
- [x] packages/packherd-require ✅ **COMPLETED**
- [ ] packages/proxy **PARTIAL** - entry point is JS
- [x] packages/reporter ✅ **COMPLETED**
- [ ] packages/resolve-dist **PARTIAL** - entry point is JS
- [ ] packages/rewriter **PARTIAL** - entry point is JS
- [ ] packages/root
- [x] packages/runner ✅ **COMPLETED**
- [ ] packages/scaffold-config **PARTIAL** - entry point is JS
- [ ] packages/server **PARTIAL** - many source/test files in JS. highest priority
- [ ] packages/socket **PARTIAL** - entry point is JS. Tests are JS
- [x] packages/stderr-filtering ✅ **COMPLETED**
- [ ] packages/telemetry **PARTIAL** - entry point is JS
- [ ] packages/ts **PARTIAL** - ultimate goal is removal and likely not worth the effort to convert
- [ ] packages/types **PARTIAL** - entry point is JS
- [x] packages/v8-snapshot-require
- [x] packages/web-config


### Phase 2: Convert Package tests from Mocha to Vitest

#### Status

##### NPM Packages

- [x] cli ✅ **COMPLETED** 
- [x] npm/cypress-schematic ✅ **COMPLETED**
- [ ] npm/eslint-plugin-dev
- [x] npm/grep ✅ **COMPLETED** 
- [ ] npm/puppeteer
- [x] npm/vite-dev-server ✅ **COMPLETED** 
- [ ] npm/webpack-batteries-included-preprocessor
- [ ] npm/webpack-dev-server
- [ ] npm/webpack-preprocessor

##### Binary Packages

- [ ] packages/config
- [ ] packages/data-context
- [x] packages/driver ✅ **COMPLETED**
- [x] packages/electron ✅ **COMPLETED**
- [ ] packages/error
- [ ] packages/extension
- [ ] packages/https-proxy
- [x] packages/electron ✅ **COMPLETED**
- [ ] packages/https-proxy
- [ ] packages/icons
- [ ] packages/launcher
- [ ] packages/net-stubbing
- [ ] packages/network
- [ ] packages/packherd-require
- [ ] packages/proxy
- [ ] packages/rewriter
- [ ] packages/scaffold-config
- [ ] packages/server
- [ ] packages/socket
- [x] packages/stderr-filtering ✅ **COMPLETED**
- [ ] packages/telemetry
- [ ] packages/ts - ultimate goal is removal and likely not worth the effort to convert
- [x] packages/types ✅ **COMPLETED**
- [ ] packages/v8-snapshot-require

### Phase 3: Bundle ESM/CJS versions of NPM packages 

TBD: details will be clearer at the end of Phase 2

### Phase 4: Run Cypress server as an ESM package

TBD: details will be clearer at the end of Phase 2
