if (process.env.CYPRESS_INTERNAL_TS_DEV) {
  require('@packages/ts/register')
}

module.exports = require('./lib/proxy')

module.exports.CA = require('./lib/ca')
