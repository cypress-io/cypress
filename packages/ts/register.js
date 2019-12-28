const log = require('debug')('cypress:ts')

// in development we should have TypeScript hook installed
// in production or staging we are likely to be running
// built Electron app without ts-node hook. Assume the
// build has been done correctly

try {
  const tsNode = require('ts-node')
  const path = require('path')

  const stack = (new Error('not a real error')).stack
  const requiringPackage = stack.split('\n').find((v) => v.includes('/packages/') && !v.includes('packages/ts'))
  const packageName = requiringPackage.match('\/packages\/(.*?)\/')[1]

  // register TypeScript Node require hook
  // https://github.com/TypeStrong/ts-node#programmatic-usage
  const packagePath = path.join(__dirname, '..', packageName)
  const project = path.join(packagePath, 'tsconfig.json')

  // transpile TypeScript without checking types by default
  // set environment variable when you want to actually verify types
  const fast = Boolean(process.env.TS_CHECK_TYPES) === false

  log('register TypeScript project %s fast? %s', project, fast)

  tsNode.register({
    project,
    fast,
  })

  // do we need to prevent any other TypeScript hooks?
  // like @packages/coffee/register.js does?
} catch (e) {
  // continue running without TypeScript require hook
  log('Running without ts-node hook in environment "%s"', process.env.CYPRESS_ENV)
}
