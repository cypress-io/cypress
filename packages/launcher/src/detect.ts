import _ = require('lodash')
import os = require('os')
import Promise = require('bluebird')
import linux = require('./linux')
import darwin = require('./darwin')

type NotInstalledError = Error & {notInstalled: boolean}

const browsers = [
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

const setMajorVersion = (obj) => {
  obj.majorVersion = obj.version.split('.')[0]
  return obj
}

function lookup (platform, obj) {
  switch (platform) {
    case 'darwin':
      const fn = darwin[obj.name]
      if (fn) {
        return fn.get(obj.executable)
      } else {
        const err: NotInstalledError =
          new Error('Browser not installed: #{obj.name}') as NotInstalledError
        err.notInstalled = true
        Promise.reject(err)
      }
      break
    case 'linux':
      return linux.get(obj.binary, obj.re)
    // TODO handle default case?
  }
}

module.exports = () => {
  const platform = os.platform()

  return Promise.map(browsers, (obj) =>
    lookup(platform, obj)
    .then(props => {
      return _.chain({})
      .extend(obj, props)
      .pick('name', 'type', 'version', 'path')
      .value()
    })
    .then(setMajorVersion)
    .catch(err => {
      if (err.notInstalled) {
        return false
      }
      throw err
    })
  ).then(_.compact)
}
