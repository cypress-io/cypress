import { writeJson } from 'fs-extra'
import { launchBrowser, SpawnFunction } from './browsers'
import { detectBrowsers } from './detect'
import { printDetectedBrowsers } from './print'
import { Browser, LauncherApi } from './types'
import { log } from './log'
import * as cp from 'child_process'

const Promise = require('bluebird')

const missingConfig = () =>
  Promise.reject(new Error('You must provide a path to a config file.'))

const wrap = (all: Browser[]) => {
  log('wrapping all browsers', all)
  return {
    launch: (
      name: string,
      url: string,
      args = [],
      spawn: SpawnFunction = cp.spawn
    ) => launchBrowser(all, name, url, args, spawn)
  }
}

const init = (browsers?: Browser[] | string) => {
  if (typeof browsers === 'string') {
    log('setting to just single browser', browsers)
    return detectBrowsers(browsers).then(wrap)
  }

  if (Array.isArray(browsers) && browsers.length) {
    log('init OS browsers')
    return wrap(browsers)
  } else {
    log('finding browsers first')
    return detectBrowsers().then(wrap)
  }
}

const api: LauncherApi = (init as any) as LauncherApi

const update = (pathToConfig?: string) => {
  if (!pathToConfig) {
    return missingConfig()
  }

  // detect the browsers and set the config
  const saveBrowsers = (browsers: Browser[]) =>
    writeJson(pathToConfig, browsers, { spaces: 2 })

  return detectBrowsers().then(saveBrowsers)
}

// extend "api" with a few utility methods for convenience
api.update = update
api.detect = detectBrowsers
api.printDetectedBrowsers = printDetectedBrowsers

module.exports = api
