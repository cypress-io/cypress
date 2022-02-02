if (process.env.CYPRESS_INTERNAL_TS_DEV) {
  require('@packages/ts/register')
}

module.exports = require('./lib')
