if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
  require('@packages/ts/register')
  module.exports = require('./src')
} else {
  module.exports = require('./dist')
}
