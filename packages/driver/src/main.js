require('setimmediate')

require('./config/bluebird')
require('./config/jquery')
require('./config/lodash')
require('./config/dayjs')

module.exports = require('./cypress')
