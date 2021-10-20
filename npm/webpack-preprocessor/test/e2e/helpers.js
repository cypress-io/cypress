/* eslint-disable no-console, prefer-rest-params */

const { codeFrameColumns } = require('@babel/code-frame')
const fs = require('fs-extra')
const _ = require('lodash')
const path = require('path')
const { expect } = require('chai')
const bluebird = require('bluebird')
const Debug = require('debug')
const chalk = require('chalk')
const stripAnsi = require('strip-ansi')
const cypress = require('cypress')
const debug = Debug('test')
const rootDir = process.cwd()

const cp = require('child_process')

const _spawn = cp.spawn

cp.spawn = function () {
  arguments[2].stdio = 'pipe'
  const ret = _spawn.apply(this, arguments)

  return ret
}

afterEach(function () {
  const err = this.currentTest.err

  if (err) {
    mapError(err)
  }
})

beforeEach(function () {
  this.currentTest.timeout(50000)
})

exports.runTest = async (options = {}) => {
  if (!options.spec) {
    throw new Error('options.spec not supplied')
  }

  let parsedSpecOptions = {}

  if (!_.isArray(options.spec)) {
    const fileStr = (await fs.readFile(options.spec)).toString()
    const match = /\/\*\s*EXPECT:\s*({.*})\s*\*\//s.exec(fileStr)

    if (match) {
      console.log(match[1])
      parsedSpecOptions = require('json5').parse(match[1])
    }
  }

  const opts = _.defaults(options, {
    spec: '',
    expectedResults: {
      totalFailed: 0,
    },
    stdoutInclude: null,
    browser: 'electron',
    exit: true,
  })

  _.merge(opts, parsedSpecOptions)

  if (_.isString(opts.stdoutInclude)) {
    opts.stdoutInclude = [opts.stdoutInclude]
  }

  console.log(chalk.cyanBright(`starting test run: ${opts.spec}`))

  const stdio = captureStdio(process.stdout)

  let stdout

  _.extend(process.env, {
    FAKE_CWD_PATH: '/[cwd]',
    DEBUG_COLORS: '1',
    // prevent any Compression progress
    // messages from showing up
    VIDEO_COMPRESSION_THROTTLE: 120000,

    // don't fail our own tests running from forked PR's
    CYPRESS_INTERNAL_SYSTEM_TESTS: '1',
    CYPRESS_ENV: 'test',
  })

  return cypress.run({
    spec: opts.spec,
    browser: opts.browser,
    exit: opts.exit,
    config: {
      video: false,
    },
    dev: true,
  })
  .finally(() => {
    stdout = stdio.toString()
    stdio.restore()
  })
  .then((res) => {
    expect(res).includes(opts.expectedResults)
  })
  .then(() => {
    if (opts.stdoutInclude) {
      _.forEach(opts.stdoutInclude, (v) => {
        expect(stdout).include(v)
        console.log(`${chalk.bold('run matched stdout:')}\n${v}`)
      })
    }

    // console.log(stdout)
    console.log(`${chalk.bold('run matched these results:')} ${JSON.stringify(opts.expectedResults, null, 2)}`)
  })
}

const mapError = async (e) => {
  const slicedStack = e.stack.split('\n') //.slice(1)

  debug({ slicedStack })
  const lastSrcStack = _.findIndex(
    slicedStack,
    (v) => !v.includes('node_modules') && v.split(path.sep).length > 2,
  )

  debug({ lastSrcStack })

  const entryNodeModuleStack = null //slicedStack[lastSrcStack - 1]

  debug({ entryNodeModuleStack })

  const entryNodeModuleRE = /node_modules\/(.*?)\//.exec(
    entryNodeModuleStack,
  )
  let entryNodeModule

  if (entryNodeModuleRE) {
    entryNodeModule = entryNodeModuleRE[1]
  }

  // debug({ entryNodeModule })
  let codeFrame

  debug({ stack: e.stack.split('\n'), rootDir })
  const srcStackArr = await bluebird
  .resolve(
    e.stack
    .split('\n')
    .filter(
      (v, i) => {
        return i === 0 ||
              (!v.includes('/node_modules/')) // && v.includes(rootDir))
      },
    ),
  )
  .mapSeries(async (v) => {
    const match = /^(\W+)(at[^(]*)\(?(.+?)(:)(\d+)(:)(\d+)(\)?)/.exec(v)

    debug({ mapStack: v, match })
    if (match) {
      const relativePath = match[3] //path.relative(rootDir, match[3])

      match[3] = relativePath
      if (!codeFrame) {
        codeFrame = await getCodeFrame(match)
      }

      match[3] = chalk.rgb(72, 160, 191)(relativePath)

      return match.slice(1).join('')
    }

    return v
  })

  const srcStack = srcStackArr.join('\n')
  const srcStackShort = srcStackArr.slice(1, 2).join('\n')

  debug(srcStack)

  console.log(chalk.dim(srcStack))
  console.log(codeFrame)

  console.log(`
    ☠️  ${
  entryNodeModule ? ` [${chalk.bold(entryNodeModule)}] ` : ''
}${chalk.red(e.message)}
      ${srcStackShort}
  `)
}

const getCodeFrame = async (info) => {
  if (await fs.pathExists(info[3])) {
    const location = { start: { line: +info[5], column: +info[7] } }
    const rawlines = (await fs.readFile(info[3])).toString()
    // .split('\n')
    // .slice(location.start.line - 2, location.start.line + 2)
    // .join('\n')
    // debug({ path: info[1], location })
    const result = codeFrameColumns(rawlines, location, {
      highlightCode: true,
      linesAbove: 2,
      linesBelow: 3,
    })

    return `\n${result}`
  }
}

const captureStdio = (stdio, tty) => {
  let logs = []
  let passThrough = null

  const write = stdio.write
  const isTTY = stdio.isTTY

  stdio.write = function (str) {
    logs.push(str)
    if (passThrough) {
      return write.apply(this, [passThrough(str)])
    }
  }

  if (tty !== undefined) stdio.isTTY = tty

  return {
    toString: () => {
      return stripAnsi(logs.join(''))
    },

    restore () {
      stdio.write = write
      stdio.isTTY = isTTY
    },
  }
}
