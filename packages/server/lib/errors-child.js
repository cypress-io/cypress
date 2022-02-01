/* eslint-disable no-console */
// Used in both the child process

const chalk = require('chalk')
const { stripIndent } = require('common-tags')
const _ = require('lodash')

const isCypressErr = (err) => {
  return Boolean(err.isCypressErr)
}

const markdownLinkRegex = /\[(.*)\]\((.*)\)(.*)\.?[^\S\r\n]*/gm
const dotColonRegex = /\.\:/g

/**
 * Changes markdown links to a more stdout-friendly format. Given the following:
 *   A line with [a link](https://on.cypress.io) in it.
 * it will convert it to:
 *   A line with a link in it: https://on.cypress.io
 */
const delinkify = (text) => {
  return text
  .replace(markdownLinkRegex, '$1$3: $2')
  .replace(dotColonRegex, ':')
}

const log = function (err, color = 'red') {
  console.log(chalk[color](delinkify(err.message)))

  if (err.details) {
    console.log(`\n${chalk['yellow'](err.details)}`)
  }

  // bail if this error came from known
  // list of Cypress errors
  if (isCypressErr(err)) {
    return
  }

  console.log(chalk[color](err.stack))

  return err
}

const get = (type, ...args) => {
  let msg = trimMultipleNewLines(ErrorsUsedInChildProcess[type](...args))

  const err = new Error(msg)

  err.isCypressErr = true
  err.type = type

  return err
}

const warning = function (type, ...args) {
  const err = get(type, ...args)

  log(err, 'magenta')

  return null
}

const twoOrMoreNewLinesRe = /\n{2,}/

const trimMultipleNewLines = (str) => {
  return _
  .chain(str)
  .split(twoOrMoreNewLinesRe)
  .compact()
  .join('\n\n')
  .value()
}

const ErrorsUsedInChildProcess = {
  DEPRECATED_BEFORE_BROWSER_LAUNCH_ARGS: () => {
    return stripIndent`\
      Deprecation Warning: The \`before:browser:launch\` plugin event changed its signature in version \`4.0.0\`
      
      The \`before:browser:launch\` plugin event switched from yielding the second argument as an \`array\` of browser arguments to an options \`object\` with an \`args\` property.
      
      We've detected that your code is still using the previous, deprecated interface signature.
      
      This code will not work in a future version of Cypress. Please see the upgrade guide: ${chalk.yellow('https://on.cypress.io/deprecated-before-browser-launch-args')}`
  },

  DUPLICATE_TASK_KEY: (arg1) => {
    return `Warning: Multiple attempts to register the following task(s): ${chalk.blue(arg1)}. Only the last attempt will be registered.`
  },
}

module.exports = {
  log,
  warning,
  trimMultipleNewLines,
  get,
}
