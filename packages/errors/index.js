try {
  require.resolve('./dist')
  module.exports = require('./dist')
} catch (e) {
  require('@packages/ts/register')
  module.exports = require('./src')
}
