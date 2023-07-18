/* eslint-disable no-console */
require('../spec_helper')

const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const snapshot = require('../support/snapshot')
const { normalizeResults } = require('../support/normalize')

const cypress = require(`${lib}/cypress`)

const normalizeBrowsers = (browsers) => {
  return browsers.filter((browser) => browser.name === 'electron')
}

const str = (obj) => JSON.stringify(obj, null, 2)

describe('module api, after:spec, and after:run results', () => {
  it('has expected properties and values', async function () {
    // give extra time to read files since it can be slow in CI
    this.timeout(60000)

    os.platform.returns('darwin')
    os.release.returns('1.0.0')

    console.log('🔵🔵🔵🔵 cypress.run 🔵🔵🔵🔵')

    const moduleResults = await cypress.run({
      project: path.resolve(__dirname, '..', 'fixture', 'results-project'),
      // @ts-expect-error
      dev: true,
    })

    console.log('🔵🔵🔵🔵 after 🔵🔵🔵🔵')

    let afterRunPath
    let afterSpecPath

    try {
      afterRunPath = path.resolve(__dirname, '..', 'fixture', 'results-project', '_results', 'results-after-run.json')
      afterSpecPath = path.resolve(__dirname, '..', 'fixture', 'results-project', '_results', 'results-after-spec.json')
    } catch (err) {
      console.log('🔴 path.resolve failed:', err.stack)
    }

    let afterRunResults
    let afterSpecResults

    try {
      afterRunResults = await fs.readJSON(afterRunPath)
      afterSpecResults = await fs.readJSON(afterSpecPath)
    } catch (err) {
      console.log('🔴 read json failed:', err.stack)
    }

    moduleResults.config.browsers = normalizeBrowsers(moduleResults.config.browsers)
    afterRunResults.config.browsers = normalizeBrowsers(afterRunResults.config.browsers)

    const moduleResultsString = str(moduleResults)
    const afterRunResultsString = str(afterRunResults)
    const afterSpecResultsString = str(afterSpecResults)

    snapshot('module api results', normalizeResults(moduleResultsString))
    snapshot('after:run results', normalizeResults(afterRunResultsString))
    snapshot('after:spec results', normalizeResults(afterSpecResultsString))
  })
})
