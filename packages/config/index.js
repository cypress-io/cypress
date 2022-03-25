if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
  require('@packages/ts/registerFunction')(__dirname)
}

module.exports = require('./src')
