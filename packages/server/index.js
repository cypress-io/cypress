// Dev-only shim — do not put startup logic here.
//
// package.json "main" points at this file so Electron can load the server package
// during local development. The real implementation lives in index.ts.
//
// In dev:
//   1. Register tsx so require() can load TypeScript sources.
//   2. Delegate to index.ts and call start().
//
// In production (binary build):
//   build-prod (tsc) compiles index.ts → index.js, replacing this shim before packaging.
//   binary-cleanup.js then esbuilds that compiled index.js into the app bundle (plain JS,
//   no tsx, no .ts files). The bundle auto-starts via require.main === module in index.ts.
require('tsx/cjs')

require('./index.ts').start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
