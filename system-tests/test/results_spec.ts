import path from 'path'
import { fs } from '@packages/server/lib/util/fs'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'
// source: https://www.myintervals.com/blog/2009/05/20/iso-8601-date-validation-that-doesnt-suck/
const isoDateRegex = /"([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?"/g
const numberRegex = /"(duration|totalDuration|port)": \d+/g
const osNameRegex = /"(osName|platform)": "[^"]+"/g
const archRegex = /"arch": "[^"]+"/g
const versionRegex = /"(browserVersion|cypressVersion|osVersion|resolvedNodeVersion|version)": "[^"]+"/g
const majorVersionRegex = /"(majorVersion)": [0-9]+/g
const pathRegex = /"(absolute|projectRoot|downloadsFolder|fileServerFolder|fixturesFolder|resolvedNodePath|screenshotsFolder|videosFolder|cypressBinaryRoot|path)": "[^"]+"/g
// matches similar to: `\n    at SOME_CODEPATH"`
const stackLineRegex = /(\Wn {4}at.+)"/g

/**
 * normalize dynamic data in results json like dates, paths, durations, etc
 * @param {string} resultsJson input string
 * @returns {string} cleaned output string
 */
const normalizeResults = (resultsJson) => {
  return resultsJson
  .replace(isoDateRegex, '"2015-03-18T00:00:00.000Z"')
  .replace(numberRegex, '"$1": 100')
  .replace(pathRegex, '"$1": "/path/to/$1"')
  .replace(versionRegex, '"$1": "X.Y.Z"')
  .replace(majorVersionRegex, '"$1": "X"')
  .replace(osNameRegex, '"$1": "linux"')
  .replace(archRegex, '"arch": "x64"')
  .replace(stackLineRegex, ' <stack lines>"')
}

const normalizeBrowsers = (browsers) => {
  return browsers.filter((browser) => browser.name === 'electron')
}

const stringify = (obj) => JSON.stringify(obj, null, 2)

describe('module api, after:spec, and after:run results', () => {
  systemTests.setup()

  const projectPath = Fixtures.projectPath('results')
  const outputPath = path.join(projectPath, 'module-api-results.json')

  systemTests.it('has expected properties and values', {
    project: 'results',
    browser: 'electron',
    outputPath,
    expectedExitCode: 3,
    config: {
      retries: 2,
    },
    async onRun (execFn) {
      await execFn()

      const moduleResults = await fs.readJson(outputPath)
      const afterRunResults = await fs.readJson(path.join(projectPath, '_results', 'results-after-run.json'))
      const afterSpecResults = await fs.readJson(path.join(projectPath, '_results', 'results-after-spec.json'))

      expect(moduleResults).to.deep.equal(afterRunResults)

      moduleResults.config.browsers = normalizeBrowsers(moduleResults.config.browsers)
      moduleResults.config.env = {}

      const moduleResultsString = stringify(moduleResults)
      const afterSpecResultsString = stringify(afterSpecResults)

      systemTests.snapshot('module api and after:run results', normalizeResults(moduleResultsString))
      systemTests.snapshot('after:spec results', normalizeResults(afterSpecResultsString))
    },
  })
})
