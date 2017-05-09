import * as fs from 'fs-extra'

const Promise = require('bluebird')
const detect = require('./detect')
const browsers = require('./browsers')

const missingConfig = () =>
  Promise.reject(new Error('You must provide a path to a config file.'))

const api = browser => (
{
  launch: (name, url, args = []) =>
      browsers.launch(browser, name, url, args)
}
)

const init = browsers =>
  browsers ? api(browsers) : detect().then(api)

const update = (pathToConfig) => {
  if (!pathToConfig) {
    return missingConfig()
  }

  // detect the browsers and set the config
  return detect()
    .then((browers) =>
      fs.writeJson(pathToConfig, browers, {spaces: 2})
    )
}

const launcher = {
  init,
  update,
  detect
}

module.exports = launcher
