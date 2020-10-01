'use strict'

const Module = require('module')
const minified = process.env.BUNDLED_MINIFIED != null

if (process.env.REQUIRE_FROM_BUNDLE != null) {
  // Need to load ts/register first so it can setup it's own require hook
  require('@packages/ts/register')
  hookRequire()
}

function hookRequire () {
  const origRequire = Module.prototype.require
  const resolve = minified
    ? require('../results/bundle.min')
    : require('../results/bundle')

  Module.prototype.require = function (id) {
    const resolved = resolve(id)
    // eslint-disable-next-line
    if (resolved != null) {
      return resolved
    }

    try {
      return origRequire.apply(this, arguments)
    } catch (err) {
      //  Running into safefs issue which seems to work fine if ignored
      //  console.error(err)
      throw err
    }
  }
}
