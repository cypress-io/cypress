'use strict'
const assert = require('assert')

function manipulateCache () {
  // deep-sync-deps depends on sync-deps, however that is already
  // fully initialized as parts of deep-sync-deps exports
  const sync1 = require('./lib/sync-deps.js')

  // We delete sync-deps from the module cache
  const syncDepsId = require.resolve('./lib/sync-deps.js')

  delete require.cache[syncDepsId]

  // NOTE: that deep-sync-deps has never been required.
  // There for with plain Node.js when loading deepsync-deps fresh we'd
  // expect  sync-deps to be reloaded fresh as well
  const sync2 = require('./lib/deep-sync-deps.js').dep

  return { sync1, sync2 }
}

module.exports = { manipulateCache }

const { sync1, sync2 } = manipulateCache()

assert(sync1 !== sync2)

// eslint-disable-next-line no-unused-vars
function manipulateExports () {
  // eslint-disable-next-line no-unused-vars
  const child = {
    foo: 'foo',
    bar: 'bar',
  }
  const p1 = require('./p1')

  p1.bar = 'baz'
  const p2 = require('./p2')

  assert(p2.bar === 'baz')
}
