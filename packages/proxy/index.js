if (process.env.CYPRESS_ENV !== 'production') {
  require('@packages/ts/register')
}

module.exports = require('./lib')
