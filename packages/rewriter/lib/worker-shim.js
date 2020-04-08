if (process.env.CYPRESS_INTERNAL_ENV === 'production') {
  throw new Error('worker-shim should only run outside of prod')
}

require('@packages/ts/register')
require('./worker.ts')
