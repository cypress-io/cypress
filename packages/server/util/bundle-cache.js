'use strict'

const Module = require('module')

if (process.env.REQUIRE_FROM_BUNDLE != null) hookRequire()

function hookRequire () {
  const origRequire = Module.prototype.require

  const minified = process.env.BUNDLED_MINIFIED != null
  const resolve = minified
    ? require('../results/bundle.min')
    : require('../results/bundle')

  Module.prototype.require = function (id) {
    const resolved = resolve(id)
    // eslint-disable-next-line
    if (resolved != null) console.log(id)

    return resolved || origRequire.apply(this, arguments)
  }
}
