if (process.env.CYPRESS_INTERNAL_ENV === 'production') {
  throw new Error(`${__filename} should only run outside of prod`)
}

require('@packages/ts/register')
require('./worker.ts')
