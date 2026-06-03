import debugModule from 'debug'
import { sync as globbySync } from 'globby'
import { getTestNames } from 'find-test-names'
import { readFileSync } from 'fs'
import { version } from '../package.json'
import { parseGrep, shouldTestRun } from './utils'
const debug = debugModule('@cypress/grep')

interface CypressConfigOptions {
  expose?: Record<string, any>
  specPattern?: string | string[]
  excludeSpecPattern?: string | string[]
}

/**
 * Prints the "@cypress/grep" environment values if any.
 * @param {Cypress.ConfigOptions} config
 */
export function plugin (config: CypressConfigOptions): CypressConfigOptions {
  if (!config || !config.expose) {
    return config
  }

  const { expose } = config

  if (!config.specPattern) {
    throw new Error(
      'Incompatible versions detected, @cypress/grep 3.0.0+ requires Cypress 10.0.0+',
    )
  }

  debug('@cypress/grep plugin version %s', version)
  debug('Cypress config expose object: %o', expose)

  const grep = expose.grep ? String(expose.grep) : undefined

  if (grep) {
    console.log('@cypress/grep: tests with "%s" in their names', grep.trim())
  }

  const grepTags = expose.grepTags || expose['grep-tags']

  if (grepTags) {
    console.log('@cypress/grep: filtering using tag(s) "%s"', grepTags)
    const parsedGrep = parseGrep(null, grepTags)

    debug('parsed grep tags %o', parsedGrep.tags)
  }

  const grepBurn = expose.grepBurn || expose['grep-burn'] || expose.burn

  if (grepBurn) {
    console.log('@cypress/grep: running filtered tests %d times', grepBurn)
  }

  const grepUntagged = expose.grepUntagged || expose['grep-untagged']

  if (grepUntagged) {
    console.log('@cypress/grep: running untagged tests')
  }

  const omitFiltered = expose.grepOmitFiltered || expose['grep-omit-filtered']

  if (omitFiltered && (grep || grepTags || grepUntagged)) {
    console.log('@cypress/grep: non-matching tests will be omitted from results (not skipped)')
  }

  const { specPattern, excludeSpecPattern } = config
  const integrationFolder = expose.grepIntegrationFolder || process.cwd()

  const grepFilterSpecs = expose.grepFilterSpecs === true || String(expose.grepFilterSpecs).toLowerCase() === 'true'

  if (grepFilterSpecs) {
    debug('specPattern', specPattern)
    debug('excludeSpecPattern', excludeSpecPattern)
    debug('integrationFolder', integrationFolder)
    const specFiles = globbySync(specPattern, {
      cwd: integrationFolder,
      ignore: Array.isArray(excludeSpecPattern) ? excludeSpecPattern : [excludeSpecPattern],
      absolute: true,
    })

    debug('found %d spec files', specFiles.length)
    debug('%o', specFiles)
    let greppedSpecs: string[] = []

    if (grep) {
      console.log('@cypress/grep: filtering specs using "%s" in the title', grep)
      const parsedGrep = parseGrep(grep)

      debug('parsed grep %o', parsedGrep)
      greppedSpecs = specFiles.filter((specFile: string) => {
        const text = readFileSync(specFile, { encoding: 'utf8' })

        try {
          const names = getTestNames(text)
          const testAndSuiteNames = names.suiteNames.concat(names.testNames)

          debug('spec file %s', specFile)
          debug('suite and test names: %o', testAndSuiteNames)

          return testAndSuiteNames.some((name) => {
            const shouldRun = shouldTestRun(parsedGrep, name)

            return shouldRun
          })
        } catch (err) {
          debug(err.message)
          debug(err.stack)
          console.error('Could not determine test names in file: %s', specFile)
          console.error('Will run it to let the grep filter the tests')

          return true
        }
      })

      debug('found grep "%s" in %d specs', grep, greppedSpecs.length)
      debug('%o', greppedSpecs)
    } else if (grepTags) {
      const parsedGrep = parseGrep(null, grepTags)

      debug('parsed grep tags %o', parsedGrep)
      greppedSpecs = specFiles.filter((specFile: string) => {
        const text = readFileSync(specFile, { encoding: 'utf8' })

        try {
          const testInfo = getTestNames(text)

          debug('spec file %s', specFile)
          debug('test info: %o', testInfo.tests)

          return testInfo.tests.some((info) => {
            const shouldRun = shouldTestRun(parsedGrep, null, info.tags)

            return shouldRun
          })
        } catch (err) {
          console.error('Could not determine test names in file: %s', specFile)
          console.error('Will run it to let the grep filter the tests')

          return true
        }
      })

      debug('found grep tags "%s" in %d specs', grepTags, greppedSpecs.length)
      debug('%o', greppedSpecs)
    }

    if (greppedSpecs.length) {
      config.specPattern = greppedSpecs
    } else if (grep || grepTags) {
      // Static pre-filtering found no spec whose tests match the filter. This
      // is not necessarily a problem — titles/tags built at run-time can't be
      // detected by static analysis — so fall back to running every spec and
      // let the run-time filter select the individual tests.
      console.log('@cypress/grep: could not pre-filter specs because none appeared to contain tests matching the filter:')
      grep ? console.log('@cypress/grep:   grep: %s', grep) : null
      grepTags ? console.log('@cypress/grep:   grepTags: %s', grepTags) : null
      console.log('@cypress/grep: running all specs and applying the filter to individual tests at run-time instead.')
    }
  }

  return config
}
