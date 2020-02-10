/* eslint-disable no-console */
const launcher = require('@packages/launcher')
const pluralize = require('pluralize')
const { stripIndent } = require('common-tags')
const { sortWith, ascend, prop } = require('ramda')
const browserUtils = require('../browsers/utils')
const _ = require('lodash')
const chalk = require('chalk')

// color for numbers and short values
const n = chalk.green
// color for paths
const p = chalk.cyan
// color for accents and examples
const a = chalk.yellow

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

  const item = list[_.random(0, list.length - 1, false)]
  const remaining = _.without(list, item)

  return {
    item, remaining,
  }
}

// Usually the full browser name to pass via --browser
// is <name>:<channel>. If the channel is stable, you
// can just do "--browser <name>"
const formBrowserName = (browser) => {
  if (browser.channel === 'stable') {
    return browser.name
  }

  return `${browser.name}:${browser.channel}`
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
      ${k + 1}. ${a(browser.displayName)}
        - Name: ${browser.name}
        - Channel: ${browser.channel}
        - Version: ${n(browser.version)}
        - Path: ${p(browser.path)}
        - Profile path: ${profilePath}
    `

    console.log(text)
    console.log('')
  })

  // randomly a few detected browsers to use as examples
  if (browsers.length) {
    const highlightedBrowser = a('--browser')

    console.log('Note: To use these browsers, pass their name and channel to the \'%s\' field', highlightedBrowser)
    console.log('')

    const firstDraw = pickRandomItem(browsers)

    if (firstDraw.item) {
      console.log('Examples:')
      console.log(a(`- cypress run --browser ${formBrowserName(firstDraw.item)}`))

      const secondDraw = pickRandomItem(firstDraw.remaining)

      if (secondDraw.item) {
        console.log(a(`- cypress run --browser ${formBrowserName(secondDraw.item)}`))
      }
    }
  }
}

const info = () => {
  return launcher.detect()
  .then(print)
}

module.exports = info
