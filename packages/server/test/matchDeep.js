const _ = require('lodash')
const chai = require('chai')
const sinon = require('sinon')
const { matchDeep, stringifyShort, parseMatcherFromString } = require('@packages/runner/cypress/plugins/snapshot/snapshotCommand')
const { getSnapshot, saveSnapshot } = require('@packages/runner/cypress/plugins/snapshot/snapshotPlugin')

/** @type {Mocha.ITest} */
let currentTest

const registerInMocha = () => {
  let snapshotIndex = {}

  global.beforeEach(function () {
    snapshotIndex = {}
    if (this.currentTest) {
      currentTest = this.currentTest
    }
  })

  // chai assertion 'matchSnapshot
  const matchSnapshot = function (m, snapshotName) {
    const ctx = this
    const testName = currentTest.fullTitle()
    const file = currentTest.file

    snapshotIndex[testName] = (snapshotIndex[testName] || 0) + 1
    const exactSpecName = snapshotName || `${testName} #${snapshotIndex[testName]}`

    const exp = getSnapshot({
      file,
      exactSpecName,
    })

    try {
      matchDeep.call(ctx, m, exp, { message: 'to match snapshot', chai, setGlobalSnapshot: _.noop, sinon })
    } catch (e) {
      if (_.has(e, 'act') && !e.failedMatcher) {
        if (process.env['SNAPSHOT_UPDATE'] || !exp) {
          saveSnapshot({
            file,
            exactSpecName,
            what: e.act,
          })

          return
        }
      }

      e.message = `Snapshot failed to match\n${e.message}`

      throw e
    }
  }

  // chai assertion 'matchDeep'
  const matchDeepMocha = function (...args) {
    let ret
    let act

    try {
      ret = matchDeep.apply(this, [args[0], args[1], { chai, setGlobalSnapshot: _.noop, sinon, expectedOnly: true }])
      act = ret.act
    } catch (e) {
      if (e.act) {
        act = e.act
      }

      throw e
    } finally {
      if (this.__flags.debug) {
        // eslint-disable-next-line
        console.info(act)
      }
    }

    return ret
  }

  chai.Assertion.addMethod('matchSnapshot', matchSnapshot)
  chai.Assertion.addMethod('matchDeep', matchDeepMocha)

  // print debug messages if `expect(...).debug.to.matchDeep(..)`
  chai.Assertion.addProperty('debug', function () {
    this.__flags.debug = true
  })
}

const parseSnapshot = (s) => {
  return _.cloneDeepWith(s, (value) => {
    const matcherType = parseMatcherFromString(value)

    if (matcherType) {
      const replacement = getFake(matcherType)

      return replacement
    }
  })
}

// returns deterministic fake data based on stored snapshot matcher type
// TODO: maybe make this data more interesting
const getFake = (matcherType) => {
  if (matcherType === 'number') {
    return 1
  }

  if (matcherType === 'date') {
    return new Date(0)
  }

  if (matcherType === 'string') {
    return 'foobar'
  }

  if (matcherType === 'array') {
    return []
  }
}

module.exports = {
  registerInMocha,
  stringifyShort,
  parseSnapshot,
}
