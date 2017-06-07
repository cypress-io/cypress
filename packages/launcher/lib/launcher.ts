import { writeJson } from 'fs-extra'
import { launch } from './browsers'
import detect from './detect'
import { Browser, LauncherApi } from './types'

const Promise = require('bluebird')

const missingConfig = () =>
  Promise.reject(new Error('You must provide a path to a config file.'))

const wrap = (all: Browser[]) => ({
  launch: (name: string, url: string, args = []) => launch(all, name, url, args)
})

const init = (browsers: Browser[]) =>
  browsers ? wrap(browsers) : detect().then(wrap)

const api: LauncherApi = (init as any) as LauncherApi

const update = (pathToConfig?: string) => {
  if (!pathToConfig) {
    return missingConfig()
  }

  // detect the browsers and set the config
  const saveBrowsers = (browers: Browser[]) =>
    writeJson(pathToConfig, browers, { spaces: 2 })

  return detect().then(saveBrowsers)
}

// extend "api" with a few utility methods for convenience
api.update = update
api.detect = detect

module.exports = api
