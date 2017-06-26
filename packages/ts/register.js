if (process.env.CYPRESS_ENV !== 'production') {
  // register TypeScript Node require hook
  // https://github.com/TypeStrong/ts-node#programmatic-usage
  const project = require('path').join(__dirname, 'tsconfig.json')
  const log = require('debug')('cypress:ts')

  // transpile TypeScript without checking types by default
  // set environment variable when you want to actually verify types
  const fast = Boolean(process.env.TS_CHECK_TYPES) === false

  log('register TypeScript project %s fast? %s', project, fast)

  require('ts-node').register({
    project,
    fast,
  })

  // do we need to prevent any other TypeScript hooks?
  // like @packages/coffee/register.js does?
}
