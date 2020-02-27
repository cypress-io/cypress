/* eslint-disable no-console */
const debug = require('debug')('cypress:server:info')
const launcher = require('@packages/launcher')
const pluralize = require('pluralize')
const { stripIndent } = require('common-tags')
const { sortWith, ascend, prop } = require('ramda')
const browserUtils = require('../browsers/utils')
const _ = require('lodash')
const chalk = require('chalk')
const fs = require('../util/fs')

// color for numbers and short values
const n = chalk.green
// color for paths
const p = chalk.cyan
// color for accents and examples
const a = chalk.yellow
// urls
const link = chalk.blue.underline

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

  const item = _.sample(list)
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

// for each browser computes the profile folder
// and checks if the folder exists. If exists,
// adds it to the browser object as a property
const addProfilePath = async (browsers = []) => {
  for (const browser of browsers) {
    const profilePath = browserUtils.getBrowserPath(browser)

    debug('checking profile path %s for browser %s:%s', profilePath, browser.name, browser.channel)
    try {
      const profileExists = await fs.statAsync(profilePath)

      if (profileExists && profileExists.isDirectory()) {
        debug('profile folder exists %s', profilePath)
        browser.profilePath = profilePath
      }
    } catch (e) {
      debug('problem checking profile folder %s %s', profilePath, e.message)
    }
  }

  return browsers
}

const print = (browsers = []) => {
  console.log('Displaying Cypress info...')
  console.log('')
  if (browsers.length) {
    console.log('Detected %s %s installed:', n(browsers.length), pluralize('browser', browsers.length))
  } else {
    console.log('Detected no known browsers installed')
  }

  console.log('')

  const sortByNameAndMajor = sortWith([
    ascend(prop('name')),
    ascend(prop('majorVersion')),
  ])
  const sortedByNameAndMajorVersion = sortByNameAndMajor(browsers)

  sortedByNameAndMajorVersion.forEach((browser, k) => {
    const text = stripIndent`
      ${k + 1}. ${a(browser.displayName)}
        - Name: ${browser.name}
        - Channel: ${browser.channel}
        - Version: ${n(browser.version)}
        - Executable: ${p(browser.path)}
        ${browser.profilePath ? `- Profile: ${browser.profilePath}` : ''}
    `

    console.log(text)
    console.log('')
  })

  // randomly a few detected browsers to use as examples
  if (browsers.length) {
    const highlightedBrowser = a('--browser')

    console.log('Note: to run these browsers, pass <name>:<channel> to the \'%s\' field',
      highlightedBrowser)

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

    console.log('')
    console.log('Learn More: %s', link('https://on.cypress.io/launching-browsers'))
  }
}

const info = () => {
  return launcher.detect()
  .then(addProfilePath)
  .then(print)
}

module.exports = info
