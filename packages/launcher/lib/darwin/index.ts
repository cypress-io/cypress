import { browsers, findApp } from './util'
import type { Browser, DetectedBrowser } from '@packages/types'
import * as linuxHelper from '../linux'
import Debug from 'debug'
import { get } from 'lodash'

const debugVerbose = Debug('cypress-verbose:launcher:darwin')

export { browsers }

export const getVersionString = linuxHelper.getVersionString

export const getVersionNumber = linuxHelper.getVersionNumber

export const getPathData = linuxHelper.getPathData

export function detect (browser: Browser): Promise<DetectedBrowser> {
  let findAppParams = get(browsers, [browser.name, browser.channel])

  if (!findAppParams) {
    // ok, maybe it is custom alias?
    debugVerbose('could not find %s in findApp map, falling back to linux detection method', browser.name)

    return linuxHelper.detect(browser)
  }

  return findApp(findAppParams)
  .then((val) => ({ name: browser.name, ...val }))
  .catch((err) => {
    debugVerbose('could not detect %s using findApp %o, falling back to linux detection method', browser.name, err)

    return linuxHelper.detect(browser)
  })
}
