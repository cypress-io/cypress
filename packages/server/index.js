// Dev-only shim — do not put startup logic here.
//
// package.json "main" points at this file so Electron can load the server package
// during local development. The real implementation lives in index.ts.
//
// In dev:
//   1. Register tsx so require() can load TypeScript sources.
//   2. Require index.ts, which auto-starts on load.
//
// In production (binary build):
//   build-prod (tsc) compiles index.ts → index.js, replacing this shim before packaging.
//   binary-cleanup.js then esbuilds that compiled index.js into the app bundle (plain JS,
//   no tsx, no .ts files). The compiled index.js also auto-starts on require.
require('tsx/cjs')

require('./index.ts')
