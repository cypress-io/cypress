import { writeJson } from 'fs-extra'
import { launch } from './browsers'
import detect from './detect'
import { FoundBrowser, LauncherApi } from './types'

const Promise = require('bluebird')

const missingConfig = () =>
  Promise.reject(new Error('You must provide a path to a config file.'))

const wrap = (all: FoundBrowser[]) => ({
  launch: (browser: FoundBrowser, url: string, args = []) =>
    launch(all, browser, url, args)
})

const init = (browsers: FoundBrowser[]) =>
  browsers ? wrap(browsers) : detect().then(wrap)

const api: LauncherApi = (init as any) as LauncherApi

// TODO: is this function called from anywhere?
const update = (pathToConfig?: string) => {
  if (!pathToConfig) {
    return missingConfig()
  }

  // detect the browsers and set the config
  const saveBrowsers = (browsers: FoundBrowser[]) =>
    writeJson(pathToConfig, browsers, { spaces: 2 })

  return detect().then(saveBrowsers)
}

// extend "api" with a few utility methods for convenience
api.update = update
api.detect = detect

module.exports = api
