'use strict'

function manipulateCache () {
  const sync1 = require('./lib/sync-deps.js')
  const rand1 = require('./lib/math-random.js')

  const syncDepsId = require.resolve('./lib/sync-deps.js')
  const noDepsId = require.resolve('./lib/math-random.js')

  delete require.cache[syncDepsId]
  delete require.cache[noDepsId]

  const sync2 = require('./lib/sync-deps.js')
  const rand2 = require('./lib/math-random.js')

  return { sync1, sync2, rand1, rand2 }
}

module.exports = { manipulateCache }
