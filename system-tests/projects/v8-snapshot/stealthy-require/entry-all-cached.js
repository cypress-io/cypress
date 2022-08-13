function init () {
  require('./fixtures/deep-sync-deps.js')
  require('./fixtures/native-deps.js')
  require('./fixtures/no-deps.js')
  require('./fixtures/stealthy-require-and-keep.js')
  require('./fixtures/stealthy-require.js')
  require('./fixtures/sync-deps.js')
  require('stealthy-require')
}

module.exports = init
