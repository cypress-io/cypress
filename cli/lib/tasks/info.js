/* eslint-disable no-console */
const launcher = require('@packages/launcher')
const pluralize = require('pluralize')

const print = (browsers = []) => {
  console.log('Found %s', pluralize('local browser', browsers.length, true))
  browsers.forEach((browser) => {
    console.log('%s %s (as %s.%s) at %s', browser.displayName, browser.version,
      browser.name, browser.channel, browser.path)
  })
}

const start = () => {
  return launcher.detect()
  .then(print)
}

module.exports = {
  start,
}
