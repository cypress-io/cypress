if (process.env.CYPRESS_ENV !== 'production') {
  require('@packages/ts/registerPackages')
}

module.exports = require('./lib')
