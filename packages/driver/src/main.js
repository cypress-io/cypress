require('setimmediate')

require('./config/bluebird')
require('./config/jquery')
require('./config/lodash')
require('./config/momentp')

module.exports = require('./cypress')
