const _ = require('lodash')
const chai = require('chai')
const utils = require('chai/lib/chai/utils')
const Assertion = require('chai/lib/chai/assertion')
const Core = require('chai/lib/chai/core/assertions')
const Expect = require('chai/lib/chai/interface/expect')
const Should = require('chai/lib/chai/interface/should')
const Assert = require('chai/lib/chai/interface/assert')

const CHAI_STATIC_PROPS = ['config', 'version', 'use', 'util', 'AssertionError']

const create = () => {
  const used = []

  const obj = _.pick(chai, CHAI_STATIC_PROPS)

  obj.use = function (fn) {
    if (!~used.indexOf(fn)) {
      fn(this, obj.util)
      used.push(fn)
    }

    return this
  }

  Assertion(obj, obj.util)
  Core(obj, obj.util)
  Expect(obj, obj.util)
  Should(obj, obj.util)
  Assert(obj, obj.util)

  return obj
}

module.exports = {
  utils,

  create,
}
