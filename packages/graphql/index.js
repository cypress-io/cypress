if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
  require('@packages/ts/registerPackages')
}

module.exports = require('./src')
