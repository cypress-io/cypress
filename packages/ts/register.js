// @ts-check
const log = require('debug')('cypress:ts')
const path = require('path')

// in development we should have TypeScript hook installed
// in production or staging we are likely to be running
// built Electron app without ts-node hook. Assume the
// build has been done correctly

try {
  // Prevent double-compiling if we're testing the app and already have ts-node hook installed
  // TODO(tim): e2e testing does not like this, I guess b/c it's currently using the tsconfig
  // for the app project?
  if (!process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
    const tsNode = require('ts-node')
    // register TypeScript Node require hook
    // https://github.com/TypeStrong/ts-node#programmatic-usage
    const project = require('path').join(__dirname, 'tsconfig.json')

    process.env.TS_CACHED_TRANSPILE_CACHE = path.join(__dirname, 'node_modules', '.ts-cache')

    tsNode.register({
      compiler: 'typescript-cached-transpile',
      project,
      transpileOnly: true,
      preferTsExts: true, // Helps when the files are compiled locally, resolves the TS file
    })
  }

  // do we need to prevent any other TypeScript hooks?
} catch (e) {
  // continue running without TypeScript require hook
  log('Running without ts-node hook in environment "%s"', process.env.CYPRESS_INTERNAL_ENV)
}
