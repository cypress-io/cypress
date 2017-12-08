import { FoundBrowser } from './types'
import { detectBrowsers } from './detect'

require('console.table')
const pluralize = require('pluralize')
const R = require('ramda')

function printMainBrowserInfo(browsers: FoundBrowser[]) {
  // eslint-disable-next-line no-console
  console.table(
    'Browser info',
    R.project(['name', 'displayName', 'majorVersion', 'version'], browsers)
  )
}

function printPaths(browsers: FoundBrowser[]) {
  // eslint-disable-next-line no-console
  console.table('Browser paths', R.project(['name', 'path'], browsers))
}

function printBrowsers(browsers: FoundBrowser[]) {
  console.log('detected %s', pluralize('browser', browsers.length, true))
  printMainBrowserInfo(browsers)
  printPaths(browsers)
}

/**
 * Finds browsers on the current system and prints them in nice table.
 *
 * @example printDetectedBrowsers().catch(console.error)
 * @export
 * @returns {Promise<void>}
 */
export function printDetectedBrowsers() {
  return detectBrowsers().then(printBrowsers)
}
