// register TypeScript Node require hook
// https://github.com/TypeStrong/ts-node#programmatic-usage
const project = require('path').join(__dirname, '../tsconfig.json')

// transpile TypeScript without checking types by default
// set environment variable when you want to actually verify types
const fast = Boolean(process.env.TS_CHECK_TYPES) === false

require('ts-node').register({
  project,
  fast
})

// do we need to prevent any other TypeScript hooks?
// like ../coffee/register.js does?
