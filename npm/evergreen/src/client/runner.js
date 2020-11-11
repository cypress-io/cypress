import { Mocha } from 'mocha'
import chai from 'chai'
import driver from './driver'

import { createApp } from './app'
import { load } from './load-specs'
import { renderTargets, renderMochaTarget } from './render-target'

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

export default function init (specMap, support) {
  setState(specMap, support)
  // renderMochaTarget()
  // createApp(state.specNames, { runAllSpecs })
  renderTargets()
}

export * from './plugins'
export * from './mount'
