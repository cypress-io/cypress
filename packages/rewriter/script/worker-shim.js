// Moved outside of /lib so we can rm -rf "lib/**/*.js" without deleting this
const isProduction = process.env.CYPRESS_INTERNAL_ENV === 'production'

if (!isProduction) {
  // Register tsx so we can load hook-require.ts in this worker thread.
  require('tsx/cjs')
}

const { hookRequire } = require(isProduction
  ? '@packages/server/hook-require.js'
  : '@packages/server/hook-require.ts')

hookRequire({ forceTypeScript: true })

require(isProduction ? '../lib/threads/worker.js' : '../lib/threads/worker.ts')
