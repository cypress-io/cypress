/*eslint-env browser*/

const { Mocha } = require('mocha')
const chai = require('chai')
const Bluebird = require('bluebird')
const driver = require('./driver')
const { load } = require('./load-specs')
const { renderTargets, renderMochaTarget } = require('./render-target')

const state = {}

window.whenReady = Bluebird.defer()

function loadCypressStuff () {
  (function (parent) {
    let Cypress = window.Cypress = parent.Cypress

    if (!Cypress) {
      throw new Error('Tests cannot run without a reference to Cypress!')
    }

    return Cypress.onSpecWindow(window, [])
  })(window.opener || window.parent)
}

function setupEnvironment () {
  loadCypressStuff()

  // Exposed for HMR
  window.runAllSpecs = runAllSpecs
  // window.mocha = new Mocha({ reporter: 'HTML', ui: 'bdd' })
  // window.mocha.suite.emit('pre-require', window, null, window.mocha)
  // window.chai = chai
  // const { expect, should, assert } = window.chai
  //
  // window.expect = expect
  // window.should = should
  // window.assert = assert
  // window.mocha.checkLeaks()
  // window.mocha.cleanReferencesAfterRun()
}

function setState (specMap, support) {
  // Globals, used for HMR
  window.specNames = state.specNames = Object.keys(specMap)
  window.support = state.support = support
  window.specs = state.specs = specMap
}

function executeSpecs () {
  window.whenResolve.resolve()
  //   // window.mocha.run()
  // }

// function clearCache () {
//   // state.specNames.forEach((s) => state.specs[s].reset())
}

function runAllSpecs () {
  // clearCache()
  // renderMochaTarget()
  renderTargets()
  setupEnvironment()
  Promise.all(
    state.specNames.map((name) => load(state, name)),
  ).then(executeSpecs)
}

function shouldLoad () {
  return true
}

export function init (specMap, support) {
  setState(specMap, support)
  renderTargets()
  setupEnvironment()

  Promise.all(
    state.specNames.filter(shouldLoad).map((name) => load(state, name)),
  ).then(executeSpecs)

  runAllSpecs()
}
