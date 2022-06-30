// eval here is a trick to ensure webpack doesn't try to bundle it / pre-evaluate at all,
// we're guaranteed to get the actual runtime require
if (eval('require.name') !== 'customRequire') {
  eval(`require('@packages/ts/hook-require')`)
}

module.exports = require('./server.js')
