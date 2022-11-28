const Promise = require('bluebird')
const $scriptUtils = require('@packages/driver/src/cypress/script_utils').default
const $networkUtils = require('@packages/driver/src/cypress/network_utils').default
const $sourceMapUtils = require('@packages/driver/src/cypress/source_map_utils').default

describe('src/cypress/script_utils', () => {
  context('#runScripts', () => {
    let scriptWindow
    const scripts = [
      { relativeUrl: 'cypress/integration/script1.js' },
      { relativeUrl: 'cypress/integration/script2.js' },
    ]

    beforeEach(() => {
      scriptWindow = {
        eval: cy.stub(),
        __onscriptIframeReady: cy.stub(),
      }

      cy.stub($networkUtils, 'fetch').resolves('the script contents')
      cy.stub($sourceMapUtils, 'extractSourceMap').returns()
      cy.stub($sourceMapUtils, 'initializeSourceMapConsumer').resolves()
    })

    it('fetches each script', () => {
      return $scriptUtils.runScripts(scriptWindow, scripts)
      .then(() => {
        expect($networkUtils.fetch).to.be.calledTwice
        expect($networkUtils.fetch).to.be.calledWith(scripts[0].relativeUrl)
        expect($networkUtils.fetch).to.be.calledWith(scripts[1].relativeUrl)
      })
    })

    it('extracts the source map from each script', () => {
      return $scriptUtils.runScripts(scriptWindow, scripts)
      .then(() => {
        expect($sourceMapUtils.extractSourceMap).to.be.calledTwice
        expect($sourceMapUtils.extractSourceMap).to.be.calledWith('the script contents')
        expect($sourceMapUtils.extractSourceMap).to.be.calledWith('the script contents')
      })
    })

    it('evals each script', () => {
      return $scriptUtils.runScripts(scriptWindow, scripts)
      .then(() => {
        expect(scriptWindow.eval).to.be.calledTwice
        expect(scriptWindow.eval).to.be.calledWith('the script contents\n//# sourceURL=http://localhost:3500cypress/integration/script1.js')
        expect(scriptWindow.eval).to.be.calledWith('the script contents\n//# sourceURL=http://localhost:3500cypress/integration/script2.js')
      })
    })
  })

  context('#runPromises', () => {
    it('handles promises and doesnt try to fetch + eval manually', async () => {
      const scriptsAsPromises = [() => Promise.resolve(), () => Promise.resolve()]
      const result = await $scriptUtils.runScripts({}, scriptsAsPromises)

      expect(result).to.have.length(scriptsAsPromises.length)
    })
  })
})
