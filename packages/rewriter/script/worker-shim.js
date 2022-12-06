// Moved outside of /lib so we can rm -rf "lib/**/*.js" without deleting this
if (process.env.CYPRESS_INTERNAL_ENV === 'production') {
  throw new Error(`${__filename} should only run outside of prod`)
}

const { hookRequire } = require('@packages/server/hook-require')

hookRequire({ forceTypeScript: true })

require('../lib/threads/worker.ts')
