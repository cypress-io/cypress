# lightweight logging for Node
# only shows log messages if running with
#   DEBUG=cypress:start ...
# or
#   DEBUG=cypress:* ...
# use
#   log = require('./log')
#   log('working in %s', process.cwd())
module.exports = require('debug')('cypress:server')
