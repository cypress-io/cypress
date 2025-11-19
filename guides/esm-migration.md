# ESM Migration Guide: Monorepo Alignment

## Migration Checklist

### Phase 1: Convert Packages to TypeScript

#### Criteria

- No require statements are to be used in `.ts` files
- Unit tests in package are written in TypeScript
- Does not include scripts or system test migrations

#### Notes

When migrating some of these projects away from the `ts-node` entry [see `@packages/scaffold-config` example](https://github.com/cypress-io/cypress/blob/v15.2.0/packages/scaffold-config/index.js), it is somewhat difficult to make separate browser/node entries as the v8-snapshot [tsconfig.json](https://github.com/cypress-io/cypress/blob/v15.2.0/tooling/v8-snapshot/tsconfig.json) is using an older style of module resolution where the `exports` key inside a package's `package.json` is not well supported. Because of this, we need to find ways to bundle code that is needed internally in the browser vs in node without them being a part of the same bundle. This is a temporary work around until we are able to get every package being able to build as an ES Module, which as that point we can re assess how the Cypress binary is being built as well as v8-snapshots, and will allow us to reconfigure this packages to export content in a more proper fashion. We are currently doing something similar in the following packages:

* `@packages/scaffold-config`
* `@packages/socket`
* `@packages/telemetry`

#### Status

##### NPM Packages

- [x] cli ✅ **COMPLETED** 
- [x] npm/angular ✅ **COMPLETED** 
- [x] npm/cypress-schematic ✅ **COMPLETED**
- [ ] npm/eslint-plugin-dev
- [x] npm/grep ✅ **COMPLETED** 
- [x] npm/mount-utils ✅ **COMPLETED**  
- [x] npm/puppeteer ✅ **COMPLETED** 
- [x] npm/react ✅ **COMPLETED** 
- [x] npm/svelte ✅ **COMPLETED** 
- [x] npm/vite-dev-server ✅ **COMPLETED** 
- [x] vite-plugin-cypress-esm ✅ **COMPLETED** 
- [x] npm/vue ✅ **COMPLETED** 
- [x] npm/webpack-batteries-included-preprocessor ✅ **COMPLETED**
- [x] npm/webpack-dev-server ✅ **COMPLETED** 
- [x] npm/webpack-preprocessor ✅ **COMPLETED** 

##### Binary Packages

- [ ] packages/app **PARTIAL** - low priority: frontend package
- [x] packages/config ✅ **COMPLETED**
- [ ] packages/data-context  **PARTIAL** - entry point is JS
- [x] packages/driver ✅ **COMPLETED** - source complete, cypress tests need migration
- [x] packages/electron ✅ **COMPLETED**
- [x] packages/error ✅ **COMPLETED**
- [x] packages/eslint-config ✅ **COMPLETED**
- [ ] packages/example
- [x] packages/extension ✅ **COMPLETED**
- [ ] packages/frontend-shared **PARTIAL** - entry point is JS
- [x] packages/electron ✅ **COMPLETED**
- [x] packages/https-proxy - ✅ **COMPLETED**
- [x] packages/icons ✅ **COMPLETED**
- [x] packages/launcher ✅ **COMPLETED**
- [x] packages/launchpad ✅ **COMPLETED**
- [x] packages/net-stubbing ✅ **COMPLETED**
- [x] packages/network ✅ **COMPLETED**
- [x] packages/network-tools ✅ **COMPLETED**
- [x] packages/packherd-require ✅ **COMPLETED**
- [ ] packages/proxy **PARTIAL** - entry point is JS
- [x] packages/reporter ✅ **COMPLETED**
- [x] packages/resolve-dist ✅ **COMPLETED**
- [ ] packages/rewriter **PARTIAL** - entry point is JS
- [x] packages/root ✅ **COMPLETED**
- [x] packages/runner ✅ **COMPLETED**
- [x] packages/scaffold-config ✅ **COMPLETED**
- [ ] packages/server **PARTIAL** - many source/test files in JS. highest priority
- [x] packages/socket ✅ **COMPLETED**
- [x] packages/stderr-filtering ✅ **COMPLETED**
- [x] packages/telemetry ✅ **COMPLETED**
- [ ] packages/ts **PARTIAL** - ultimate goal is removal and likely not worth the effort to convert
- [x] packages/types ✅ **COMPLETED**
- [x] packages/v8-snapshot-require
- [x] packages/web-config


### Phase 2: Convert Package tests from Mocha to Vitest

#### Status

##### NPM Packages

- [x] cli ✅ **COMPLETED** 
- [x] npm/cypress-schematic ✅ **COMPLETED**
- [x] npm/eslint-plugin-dev ✅ **COMPLETED**
- [x] npm/grep ✅ **COMPLETED** 
- [x] npm/puppeteer ✅ **COMPLETED** 
- [x] npm/vite-dev-server ✅ **COMPLETED** 
- [x] npm/webpack-batteries-included-preprocessor ✅ **COMPLETED** 
- [x] npm/webpack-dev-server ✅ **COMPLETED** 
- [x] npm/webpack-preprocessor ✅ **COMPLETED**

##### Binary Packages

- [x] packages/config ✅ **COMPLETED**
- [x] packages/data-context **COMPLETED** (migrated from `mocha`/`sinon`/`chai` to `jest`). See package README for more details as to why `jest` over `vitest`
- [x] packages/driver ✅ **COMPLETED**
- [x] packages/electron ✅ **COMPLETED**
- [x] packages/error ✅ **COMPLETED**
- [x] packages/extension ✅ **COMPLETED**
- [x] packages/https-proxy ✅ **COMPLETED**
- [x] packages/electron ✅ **COMPLETED**
- [x] packages/icons ✅ **COMPLETED**
- [x] packages/launcher ✅ **COMPLETED**
- [x] packages/net-stubbing ✅ **COMPLETED**
- [x] packages/network ✅ **COMPLETED**
- [x] packages/network-tools ✅ **COMPLETED**
- [x] packages/packherd-require ✅ **COMPLETED**
- [x] packages/proxy ✅ **COMPLETED**
- [x] packages/rewriter ✅ **COMPLETED**
- [x] packages/scaffold-config ✅ **COMPLETED**
- [ ] packages/server
- [x] packages/socket ✅ **COMPLETED**
- [x] packages/stderr-filtering ✅ **COMPLETED**
- [x] packages/telemetry ✅ **COMPLETED**
- [ ] packages/ts - ultimate goal is removal and likely not worth the effort to convert
- [x] packages/types ✅ **COMPLETED**
- [x] packages/v8-snapshot-require ✅ **COMPLETED**

### Phase 3: Bundle ESM/CJS versions of NPM packages 

TBD: details will be clearer at the end of Phase 2

### Phase 4: Run Cypress server as an ESM package

TBD: details will be clearer at the end of Phase 2
