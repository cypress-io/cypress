// Moved outside of /lib so we can rm -rf "lib/**/*.js" without deleting this
if (process.env.CYPRESS_INTERNAL_ENV === 'production') {
  throw new Error(`${__filename} should only run outside of prod`)
}

if (require.name !== 'customRequire') {
  // Purposefully make this a dynamic require so that it doesn't have the potential to get picked up by snapshotting mechanism
  const hook = './hook'

  const { hookRequire } = require(`@packages/server/${hook}-require`)

  hookRequire(true)
}

require('../lib/threads/worker.ts')
