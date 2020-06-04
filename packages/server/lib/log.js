// lightweight logging for Node
// only shows log messages if running with
//   DEBUG=cypress:start ...
// or
//   DEBUG=cypress:* ...
// use
//   log = require('./log')
//   log('working in %s', process.cwd())
// If you need a logger that might be very specific
// you can construct it yourself, just make sure
// to prefix label with "cypress:server:", for example
//   log = require('debug')('cypress:server:bundle')
module.exports = require('debug')('cypress:server')
