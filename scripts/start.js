if (!process.env.CI) {
  process.env.CYPRESS_INTERNAL_TS_DEV = 'true'
  require('@packages/ts/register')
}

require('@packages/server')
