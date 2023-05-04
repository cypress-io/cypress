if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
  require('@packages/ts/register')
}

module.exports = require('./src/node')
