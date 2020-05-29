require('setimmediate')

// to support async/await
require('regenerator-runtime/runtime')

require('./config/bluebird')
require('./config/jquery')
require('./config/lodash')
require('./config/moment')

module.exports = require('./cypress')
