/* eslint-disable no-console */
const launcher = require('@packages/launcher')
const pluralize = require('pluralize')
const { stripIndent } = require('common-tags')
const { sortWith, ascend, prop } = require('ramda')
const appData = require('../util/app_data')
const browserUtils = require('../browsers/utils')
const _ = require('lodash')

/**
 * If the list has at least 1 item, picks a random item
 * and returns it AND the remaining items.
 */
const pickRandomItem = (list) => {
  if (!list.length) {
    return {
      item: null,
      remaining: list,
    }
  }

  const item = list[_.random(0, list.length, false)]
  const remaining = _.without(list, item)

  return {
    item, remaining,
  }
}

const print = (browsers = []) => {
  console.log('Displaying Cypress info...')
  console.log('')
  console.log('Detected %s installed', pluralize('Browser', browsers.length, true))
  console.log('')

  const sortByNameAndMajor = sortWith([
    ascend(prop('name')),
    ascend(prop('majorVersion')),
  ])
  const sortedByNameAndMajorVersion = sortByNameAndMajor(browsers)

  sortedByNameAndMajorVersion.forEach((browser, k) => {
    const profilePath = browserUtils.getBrowserPath(browser)
    const text = stripIndent`
      ${k + 1}. ${browser.displayName}
        - Name: ${browser.name}
        - Version: ${browser.version}
        - Channel: ${browser.channel}
        - Path: ${browser.path}
        - Profile path: ${profilePath}
    `

    console.log(text)
    console.log('')
  })

  // randomly a few detected browsers to use as examples
  if (browsers.length) {
    console.log('Note: To use these browsers, pass their name and channel to the \'--browser\' field')
    console.log('')

    const firstRandom = pickRandomItem(browsers)

    if (firstRandom.item) {
      console.log('Examples:')
      console.log(`- cypress run --browser ${firstRandom.item.name}:${firstRandom.item.channel}`)

      const secondRandom = pickRandomItem(firstRandom.remaining)

      if (secondRandom.item) {
        console.log(`- cypress run --browser ${secondRandom.item.name}:${secondRandom.item.channel}`)
      }

      console.log('')
    }
  }

  console.log('Application data stored in folder: %s', appData.path())
}

const info = () => {
  return launcher.detect()
  .then(print)
}

module.exports = info
