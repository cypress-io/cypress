// gives anyone programmatic access to the TypeScript transpiler (tsx) used by the
// require-time hook. `@packages/ts/register` is the primary entry point.
// https://tsx.is/dev-api/register-cjs
module.exports = require('tsx/cjs/api')
