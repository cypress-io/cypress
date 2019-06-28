const _ = require('lodash')
const EE = require('events')
const sh = require('shelljs')
const chalk = require('chalk')
const Promise = require('bluebird')
const debug = require('debug')('lint/util')

const filesRegex = /\.(js|jsx|ts|tsx|coffee|json|eslintrc)$/

module.exports = {
  lintFilesByText: (options) => {
    sh.config.silent = true
    EE.defaultMaxListeners = 100

    const opts = _.defaults(options, {
      getFilenames: null,
      getFileText: null,
      getLintCommand: (f) => `./node_modules/.bin/eslint --stdin --stdin-filename ${sh.ShellString(f)} --color=true`,
    })

    const filenames = opts.getFilenames().grep(filesRegex).split('\n').filter(Boolean)

    debug(`linting:
    ${filenames.join('\n\t')}
    `)

    return Promise.map(filenames, (f) => {

      const fileText = opts.getFileText(f)
      const lintCommand = opts.getLintCommand(f)

      return Promise.promisify(fileText.exec)(
        lintCommand,
        { silent: false, async: true }
      )
      .tapCatch(debugTerse)
      .return(false)
      .catchReturn(true)

    }, { concurrency: 0 })
    .then((results) => {
      const failCount = _.filter(results).length

      debug({ failCount })

      return failCount
    })
    .then((failCount) => {
      if (failCount) {
        debug('exiting with status code', failCount)
        process.exit(failCount)
      }

      // eslint-disable-next-line no-console
      console.log(chalk.bold(`${chalk.green(filenames.length)} files linted successfully`))
    })
  },
  lintFilesByName: (options) => {
    sh.config.silent = true

    const opts = _.defaults(options, {
      getFilenames: null,
      fix: false,
    })

    const filenames = opts.getFilenames().grep(filesRegex).split('\n').filter(Boolean)

    debug(`linting:
    ${filenames.join('\n\t')}
    `)

    const filenamesString = sh.ShellString(filenames.join(' '))

    const lintCommand = opts.fix ?
      `./node_modules/.bin/eslint --color=true --fix '' ${filenamesString}`
      : `./node_modules/.bin/eslint --color=true '' ${filenamesString}`

    return Promise.promisify(sh.exec)(
      lintCommand,
      { silent: false, async: true }
    )
    .tapCatch(debugTerse)
    .return(false)
    .catchReturn(true)
    .then((failCount) => {
      if (failCount) {
        debug('exiting with status code', failCount)
        process.exit(failCount)
      }

      // eslint-disable-next-line no-console
      console.log(chalk.bold(`${chalk.green(filenames.length)} files linted successfully`))
    })
  },

}

const debugTerse = (...args) => {
  args = args.map((arg) => {
    let truncated = arg.toString().slice(0, 15)

    if (truncated !== arg.toString()) {
      truncated = `${truncated}...`
    }

    return truncated
  })

  debug(...args)
}
