import {linuxBrowser} from './linux'
import darwin from './darwin'
import {log} from './log'
import {Browser, NotInstalledError} from './types'
import * as Bluebird from 'bluebird'

import _ = require('lodash')
import os = require('os')
// import Promise = require('bluebird')

const browsers:Browser[] = [
  {
    name: 'chrome',
    re: /Google Chrome (\S+)/,
    profile: true,
    binary: 'google-chrome',
    executable: 'Contents/MacOS/Google Chrome'
  },{
    name: 'chromium',
    re: /Chromium (\S+)/,
    profile: true,
    binary: 'chromium-browser',
    executable: 'Contents/MacOS/Chromium'
  },{
    name: 'canary',
    re: /Google Chrome Canary (\S+)/,
    profile: true,
    binary: 'google-chrome-canary',
    executable: 'Contents/MacOS/Google Chrome Canary'
  }
]

const setMajorVersion = (obj:Browser) => {
  if (obj.version) {
    obj.majorVersion = obj.version.split('.')[0]
    log('browser %s version %s major version %s',
      obj.name, obj.version, obj.majorVersion)
  }
  return obj
}

type MacBrowserName = 'chrome' | 'chromium' | 'canary'

function lookup (platform:string, obj:Browser):Promise<Object> {
  log('looking up %s on %s platform', obj.name, platform)
  switch (platform) {
    case 'darwin':
      const browserName:MacBrowserName = obj.name as MacBrowserName
      const fn = darwin[browserName]
      if (fn) {
        return fn.get(obj.executable) as any as Promise<Object>
      }
      const err: NotInstalledError =
        new Error(`Browser not installed: ${obj.name}`) as NotInstalledError
      err.notInstalled = true
      throw err
    case 'linux':
      return linuxBrowser.get(obj.binary, obj.re) as any as Promise<Object>
    default:
      throw new Error(`Cannot lookup browser ${obj.name} on ${platform}`)
  }
}

function checkOneBrowser(browser:Browser) {
  const platform = os.platform()
  return lookup(platform, browser)
    .then((props:object) => {
      return _.chain({})
        .extend(browser, props)
        .pick('name', 'type', 'version', 'path')
        .value()
    })
    .then(setMajorVersion)
    .catch(err => {
      if (err.notInstalled) {
        log('browser %s not installed', browser.name)
        return false
      }
      throw err
    })
}

/** returns list of detected browsers */
function detectBrowsers (): Bluebird<Browser[]> {
  return Bluebird.map(browsers, checkOneBrowser)
    .then(_.compact) as Bluebird<Browser[]>
}

export default detectBrowsers
