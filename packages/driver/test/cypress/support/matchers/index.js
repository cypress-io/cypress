/* eslint-disable */


/**
 * This plugin allows custom composable matchers in Cypress
 * using the `matchEql` matcher.
 * Import this module as `m` for best results:
 * `const m = require('...')`
 *
 * @example
 *  `
 *  expect(obj).to.matchEql({
 *    num: m.closeTo(40, 5)
 *    title: m.match(/Some Title/)
 *  })
 * `
 */



const _ = Cypress._

const _canonicalize = Cypress.mocha._mocha.Mocha.utils.canonicalize

Cypress.mocha._mocha.Mocha.utils.canonicalize = function () {
  // console.log()
  const args = arguments
  const m = args[0]

  if (Cypress.sinon.match.isMatcher(m) || isMatcher(m)) {

    args[0] = m.toString().replace(/typeOf\(\"(.+)\"\)/, 'typeOf($1)')
  }

  if (m && m.handler && m.handler.calledAfter && m.handler.calledBefore) {
    args[0] = '[object Stub]'
  }

  const ret = _canonicalize.apply(this, args)

  return ret
}

chai.use((_chai, utils) => {

  chai.Assertion.addMethod('matchEql', function fn (subExp) {

    const subAct = utils.flag(this, 'object')
    const matchKeys = (objExp, objAct, keyPath = []) => {
      if (!_.isObject(objAct)) {
        return chai.assert.isObject(act)
      }

      _.map(objExp, (val, key) => {
        const act = objAct && objAct[key]
        const exp = val
        const newKeyPath = keyPath.concat([key])

        if (isMatcher(exp)) {
          return exp.test(act, newKeyPath)
        }

        if (_.isObject(exp)) {
          return matchKeys(exp, objAct, newKeyPath)
        }

        const keypathStr = keyPathToString(newKeyPath)

        if (_.isArray(exp)) {
          return chai.assert.deepEqual(act, exp, keypathStr)
        }

        // return chai.assert.equal(act, exp, message, null)
        const message = `expected ${keypathStr} to equal ${exp}, but was ${act}`

        new chai.Assertion(null, null, chai.assert).assert(_.isEqual(exp, act), message, message, objExp, objAct, true)

      })
    }

    matchKeys(subExp, subAct)
  })
})

const matcher = {
  toString () {
    return this.message
  },
}

function isMatcher (obj) {
  return matcher.isPrototypeOf(obj)
}

const keyPathToString = (keypath) => {
  return keypath.join(' > ')
}

const fromChaiAssertion = (assertFn, name) => {
  const m = function (...args) {
    m.test = function (act, keypath = []) {
      const message = keyPathToString(keypath)

      assertFn(act, ...args, message)
    }
    m.message = `${m.message}(${args.join(', ')})`

    return m
  }

  m.test = function (act, keypath = []) {
    const message = keyPathToString(keypath)

    assertFn(act, message)
  }

  m.message = name

  Object.setPrototypeOf(m, matcher)

  return m
}

const assertions = {}

_.map(chai.assert, (assertFn, name) => {
  assertions[name] = fromChaiAssertion(assertFn, name)
})

module.exports = {
  m: assertions,
}

// TODO:
/**
 * Create custom matchers
 */
// function createMatcher (expectation, partialMessage, diffObj) {
//   const m = Object.create(matcher)

//   m.test = function (act, keypath = []) {
//     const passed = expectation(act)
//     const message = `${keypath.join(' > ')}: expected ${partialMessage}, but it was ${chaiUtils.objDisplay(act)}`

//     new chai.Assertion(null, null, chai.assert).assert(passed, message, message, diffObj, act, true)

//   }
//   m.message = partialMessage

// }

// const closeTo = (exp, range = 2) => createMatcher(
//   num => Math.abs(num - exp) < range,
//   `to be close to ${exp} (+-2)`
// )
