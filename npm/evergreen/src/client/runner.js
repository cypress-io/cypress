const { Mocha } = require('mocha')
const chai = require('chai')
const driver = require('./driver')

const { createApp } = require('./app')
const { load } = require('./load-specs')
const { renderTargets, renderMochaTarget } = require('./render-target')

const state = {}

function loadCypressStuff() {
  (function(parent) {
    var Cypress = window.Cypress = parent.Cypress;
    if (!Cypress) {
      throw new Error("Tests cannot run without a reference to Cypress!");
    }
    return Cypress.onSpecWindow(window, []);
  })(window.opener || window.parent);
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
  // window.mocha.run()
}

function clearCache () {
  // state.specNames.forEach((s) => state.specs[s].reset())
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

export function init (specMap, support) {
  setState(specMap, support)
  // renderMochaTarget()
  // createApp(state.specNames, { runAllSpecs })
  renderTargets()
  setupEnvironment()


  console.log(state.specNames)
  Promise.all(
    state.specNames.map((name) => load(state, name)),
  ).then(executeSpecs)
  // runAllSpecs()
}
