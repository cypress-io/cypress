import { writeJson } from 'fs-extra'
import { launch, chromeVersionRegex } from './browsers'
import detect from './detect'
import { Browser, LauncherApi } from './types'
import { log } from './log'

const Promise = require('bluebird')

const missingConfig = () =>
  Promise.reject(new Error('You must provide a path to a config file.'))

const wrap = (all: Browser[]) => {
  log('wrapping all browsers', all)
  return {
    launch: (name: string, url: string, args = []) => launch(all, name, url, args)
  }
}

const init = (browsers: Browser[] | string) => {
  if (typeof browsers === 'string') {
    log('setting to just single browser', browsers)
    browsers = [{
      name: browsers,
      displayName: browsers,
      versionRegex: chromeVersionRegex,
      profile: true,
      binary: browsers
    }]
  } else {
    log('init OS browsers')
  }
  browsers ? Promise.resolve(wrap(browsers)) : detect().then(wrap)
}

const api: LauncherApi = (init as any) as LauncherApi

const update = (pathToConfig?: string) => {
  if (!pathToConfig) {
    return missingConfig()
  }

  // detect the browsers and set the config
  const saveBrowsers = (browsers: Browser[]) =>
    writeJson(pathToConfig, browsers, { spaces: 2 })

  return detect().then(saveBrowsers)
}

// extend "api" with a few utility methods for convenience
api.update = update
api.detect = detect

module.exports = api
