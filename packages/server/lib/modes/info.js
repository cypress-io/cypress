/* eslint-disable no-console */
const launcher = require('@packages/launcher')
const pluralize = require('pluralize')
const { stripIndent } = require('common-tags')
const { sortWith, ascend, prop } = require('ramda')

const print = (browsers = []) => {
  console.log('Found %s', pluralize('local browser', browsers.length, true))
  console.log('')

  const sortByNameAndMajor = sortWith([
    ascend(prop('name')),
    ascend(prop('majorVersion')),
  ])
  const sortedByNameAndMajorVersion = sortByNameAndMajor(browsers)

  sortedByNameAndMajorVersion.forEach((browser) => {
    const text = stripIndent`
      ${browser.displayName}
        - Name: ${browser.name}
        - Version: ${browser.version}
        - Channel: ${browser.channel}
        - Path: ${browser.path}
    `

    console.log(text)
    console.log('')
  })

  console.log('To use these browsers, pass their "Name" to the \'--browser\' field')
  console.log('such as: `cypress run --browser firefox:dev` or `cypress run --browser chrome:canary`')
}

const info = () => {
  return launcher.detect()
  .then(print)
}

module.exports = info
