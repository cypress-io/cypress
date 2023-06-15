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

    it('fetches each script in non-webkit browsers', () => {
      return $scriptUtils.runScripts({
        browser: { family: 'chromium' },
        scripts,
        specWindow: scriptWindow,
        testingType: 'e2e',
      })
      .then(() => {
        expect($networkUtils.fetch).to.be.calledTwice
        expect($networkUtils.fetch).to.be.calledWith(scripts[0].relativeUrl)
        expect($networkUtils.fetch).to.be.calledWith(scripts[1].relativeUrl)
      })
    })

    it('appends each script in e2e webkit', async () => {
      const foundScript = {
        after: cy.stub(),
      }
      const createdScript1 = {
        addEventListener: cy.stub(),
      }
      const createdScript2 = {
        addEventListener: cy.stub(),
      }
      const doc = {
        querySelector: cy.stub().returns(foundScript),
        createElement: cy.stub(),
      }

      doc.createElement.onCall(0).returns(createdScript1)
      doc.createElement.onCall(1).returns(createdScript2)

      scriptWindow.document = doc

      const runScripts = $scriptUtils.runScripts({
        scripts,
        specWindow: scriptWindow,
        browser: { family: 'webkit' },
        testingType: 'e2e',
      })

      // each script is appended and run before the next

      await Promise.delay(1) // wait a tick due to promise
      expect(createdScript1.addEventListener).to.be.calledWith('load')
      createdScript1.addEventListener.lastCall.args[1]()

      await Promise.delay(1) // wait a tick due to promise
      expect(createdScript2.addEventListener).to.be.calledWith('load')
      createdScript2.addEventListener.lastCall.args[1]()

      await runScripts

      // sets script src
      expect(createdScript1.src).to.equal(scripts[0].relativeUrl)
      expect(createdScript2.src).to.equal(scripts[1].relativeUrl)

      // appends scripts
      expect(foundScript.after).to.be.calledTwice
      expect(foundScript.after).to.be.calledWith(createdScript1)
      expect(foundScript.after).to.be.calledWith(createdScript2)
    })

    it('extracts the source map from each script', () => {
      return $scriptUtils.runScripts({
        browser: { family: 'chromium' },
        scripts,
        specWindow: scriptWindow,
        testingType: 'e2e',
      })
      .then(() => {
        expect($sourceMapUtils.extractSourceMap).to.be.calledTwice
        expect($sourceMapUtils.extractSourceMap).to.be.calledWith('the script contents')
        expect($sourceMapUtils.extractSourceMap).to.be.calledWith('the script contents')
      })
    })

    it('evals each script', () => {
      return $scriptUtils.runScripts({
        browser: { family: 'chromium' },
        scripts,
        specWindow: scriptWindow,
        testingType: 'e2e',
      })
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
      const result = await $scriptUtils.runScripts({
        browser: { family: 'chromium' },
        scripts: scriptsAsPromises,
        specWindow: {},
        testingType: 'e2e',
      })

      expect(result).to.have.length(scriptsAsPromises.length)
    })
  })
})
