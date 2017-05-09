import * as fs from 'fs-extra'

const Promise = require('bluebird')
const detect = require('./detect')
const browsers = require('./browsers')

const missingConfig = () =>
  Promise.reject(new Error('You must provide a path to a config file.'))

const wrap = all => ({
  launch: (name, url, args = []) =>
      browsers.launch(all, name, url, args)
})

const init = browsers =>
  browsers ? wrap(browsers) : detect().then(wrap)

const update = (pathToConfig) => {
  if (!pathToConfig) {
    return missingConfig()
  }

  // detect the browsers and set the config
  const saveBrowsers = browers =>
      fs.writeJson(pathToConfig, browers, {spaces: 2})
  return detect()
    .then(saveBrowsers)
}

const launcher = {
  init,
  update,
  detect
}

module.exports = launcher
