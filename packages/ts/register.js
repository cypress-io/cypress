const log = require('debug')('cypress:ts')
let tsNode

// in development we should have TypeScript hook installed
// in production or staging we are likely to be running
// built Electron app without ts-node hook. Assume the
// build has been done correctly

try {
  tsNode = require('ts-node')

  // register TypeScript Node require hook
  // https://github.com/TypeStrong/ts-node#programmatic-usage
  const project = require('path').join(__dirname, 'tsconfig.json')

  // transpile TypeScript without checking types by default
  // set environment variable when you want to actually verify types
  const fast = Boolean(process.env.TS_CHECK_TYPES) === false

  log('register TypeScript project %s fast? %s', project, fast)

  tsNode.register({
    project,
    fast,
  })

  // do we need to prevent any other TypeScript hooks?
} catch (e) {
  // continue running without TypeScript require hook
  log('Running without ts-node hook in environment "%s"', process.env.CYPRESS_INTERNAL_ENV)
}
