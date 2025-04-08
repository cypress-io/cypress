const path = require('path')
const _ = require('lodash')
const EE = require('events')
const sh = require('shelljs')
// const chalk = require('chalk')
const Promise = require('bluebird')
const debug = require('debug')('lint/util')

const filesRegex = /\.(js|jsx|ts|tsx|coffee|json|eslintrc)$/

Promise.config({
  warnings: true,
  longStackTraces: true,
})

module.exports = {
  lintFilesByText: (options) => {
    sh.config.silent = true
    EE.defaultMaxListeners = 100

    const opts = _.defaults(options, {
      getFilenames: null,
      getFileText: null,
    })

    const filenames = opts.getFilenames().filter((v) => filesRegex.test(v))

    debug(`linting:
    ${filenames.join('\n\t')}
    `)

    return Promise.map(filenames, (f) => {
      debug('started linting', f)

      const fileText = opts.getFileText(f)

      debugTerse('file text:', fileText)

      if (!fileText.toString()) return

      const lintCommand = `./node_modules/.bin/eslint --stdin --stdin-filename ${sh.ShellString(f)} --color=true`

      return Promise.promisify(fileText.exec)(
        lintCommand,
        { silent: false, async: true },
      )
      .tapCatch(debugTerse)
      .return(false)
      .catchReturn(true)
      .finally(() => {
        debug('finished linting ', f)
      })
    }, { concurrency: 0 })
    .then((results) => {
      const failCount = _.filter(results).length

      debug({ failCount })

      return { failCount, filenames }
    })
  },
  lintFilesByName: (options) => {
    sh.config.silent = true

    const opts = _.defaults(options, {
      getFilenames: null,
      fix: false,
    })

    const filenames = opts.getFilenames().filter((v) => filesRegex.test(v))

    debug(`linting:
    ${filenames.join('\n\t')}
    `)

    const filenamesString = sh.ShellString(filenames.join(' '))

    const lintCommand = opts.fix ?
      `npx eslint --color=true --fix ${filenamesString}`
      : `npx eslint --color=true ${filenamesString}`

    // always run command in the root of the monorepo!
    return Promise.promisify(sh.exec)(
      lintCommand,
      { silent: false, async: true, cwd: path.resolve(__dirname, '../../../../') },
    )
    .tapCatch(debugTerse)
    .return(false)
    .catchReturn(true)
    .then((failed) => {
      return {
        failed,
        filenames,
      }
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
