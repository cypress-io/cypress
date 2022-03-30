if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
  require('@packages/ts/registerDir')(__dirname)
}

module.exports = require('./src')
