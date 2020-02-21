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

const stackTraceLinesRe = /(\n?[^\S\n\r]*).*?(@|\bat\b).*\.(js|coffee|ts|html|jsx|tsx)(-\d+)?:\d+:\d+[\n\S\s]*?(\n\s*?\n|$)/g
const browserNameVersionRe = /(Browser\:\s+)(Custom |)(Electron|Chrome|Canary|Chromium|Firefox)(\s\d+)(\s\(\w+\))?(\s+)/
const availableBrowsersRe = /(Available browsers found are: )(.+)/g
const crossOriginErrorRe = /(Blocked a frame .* from accessing a cross-origin frame.*|Permission denied.*cross-origin object.*)/gm

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
    snapshot: true,
    spec: '',
    expectedResults: {
      totalFailed: 0,
    },
    expectedStdout: null,
    browser: 'electron',
    exit: true,
  })

  _.merge(opts, parsedSpecOptions)

  console.log(chalk.cyanBright(`starting test run: ${opts.spec}`))

  const stdio = captureStdio(process.stdout)

  stdio.passThrough((v) => chalk.magenta(stripAnsi(v.toString())))
  // const stdio2 = captureStdio(process.stdout)

  let stdout

  _.extend(process.env, {
    FAKE_CWD_PATH: '/[cwd]',
    DEBUG_COLORS: '1',
    // prevent any Compression progress
    // messages from showing up
    VIDEO_COMPRESSION_THROTTLE: 120000,

    // don't fail our own tests running from forked PR's
    CYPRESS_INTERNAL_E2E_TESTS: '1',
    CYPRESS_ENV: 'test',
  })

  return cypress.run({
    spec: opts.spec,
    browser: opts.browser,
    exit: opts.exit,
  })
  .finally(() => {
    stdout = stdio.toString()
    stdio.restore()
  })
  .then((res) => {
    expect(res).includes(opts.expectedResults)
  })
  .then(() => {
    if (opts.expectedStdout) {
      _.forEach(opts.expectedStdout, (v) => {
        expect(stdout).include(v)
        console.log(`${chalk.bold('run matched stdout:')}\n${v}`)
      })
    }

    // console.log(stdout)
    console.log(`${chalk.bold('run matched these results:')} ${JSON.stringify(opts.expectedResults, null, 2)}`)
    if (opts.snapshot) {
      snapshot(normalizeStdout(stdout))
    }
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

    passThrough (fn) {
      passThrough = fn
    },

    data: logs,

    reset: () => (logs = []),

    toString: () => {
      return stripAnsi(logs.join(''))
    },

    toStringRaw: () => {
      return logs.join('')
    },

    restore () {
      stdio.write = write
      stdio.isTTY = isTTY
    },
  }
}

exports.captureStdio = captureStdio

const snapshot = require('snap-shot-it')

function replaceStackTraceLines (str) {
  return str.replace(stackTraceLinesRe, (match, ...parts) => {
    let pre = parts[0]
    const isFirefoxStack = parts[1] === '@'
    let post = parts[4]

    if (isFirefoxStack) {
      if (pre === '\n') {
        pre = '\n    '
      } else {
        pre += pre.slice(1).repeat(2)
      }

      post = post.slice(-1)
    }

    return `${pre}[stack trace lines]${post}`
  })
}

function normalizeStdout (str, options = {}) {
  const { normalizeStdoutAvailableBrowsers } = options

  // remove all of the dynamic parts of stdout
  // to normalize against what we expected
  str = str
  // /Users/jane/........../ -> //foo/bar/.projects/
  // (Required when paths are printed outside of our own formatting)
  .split(process.cwd()).join('/[cwd]')

  // unless normalization is explicitly turned off then
  // always normalize the stdout replacing the browser text
  if (normalizeStdoutAvailableBrowsers !== false) {
    // usually we are not interested in the browsers detected on this particular system
    // but some tests might filter / change the list of browsers
    // in that case the test should pass "normalizeStdoutAvailableBrowsers: false" as options
    str = str.replace(availableBrowsersRe, '$1browser1, browser2, browser3')
  }

  const replaceBrowserName = function (str, key, customBrowserPath, browserName, version, headless, whitespace) {
  // get the padding for the existing browser string
    const lengthOfExistingBrowserString = _.sum([browserName.length, version.length, _.get(headless, 'length', 0), whitespace.length])

    // this ensures we add whitespace so the border is not shifted
    return key + customBrowserPath + _.padEnd('FooBrowser 88', lengthOfExistingBrowserString)
  }

  const replaceDurationSeconds = function (str, p1, p2, p3, p4) {
  // get the padding for the existing duration
    const lengthOfExistingDuration = _.sum([(p2 != null ? p2.length : undefined) || 0, p3.length, p4.length])

    return p1 + _.padEnd('X seconds', lengthOfExistingDuration)
  }

  // duration='1589'
  const replaceDurationFromReporter = (str, p1, p2, p3) => {
    return p1 + _.padEnd('X', p2.length, 'X') + p3
  }

  const replaceNodeVersion = (str, p1, p2, p3) => _.padEnd(`${p1}X (/foo/bar/node)`, (p1.length + p2.length + p3.length))

  // when swapping out the duration, ensure we pad the
  // full length of the duration so it doesn't shift content
  const replaceDurationInTables = (str, p1, p2) => {
    return _.padStart('XX:XX', p1.length + p2.length)
  }

  // could be (1 second) or (10 seconds)
  // need to account for shortest and longest
  const replaceParenTime = (str, p1) => {
    return _.padStart('(X second)', p1.length)
  }

  const replaceScreenshotDims = (str, p1) => _.padStart('(YxX)', p1.length)

  const replaceUploadingResults = function (orig, ...rest) {
    const adjustedLength = Math.max(rest.length, 2)
    const match = rest.slice(0, adjustedLength - 2)
    const results = match[1].split('\n').map((res) => res.replace(/\(\d+\/(\d+)\)/g, '(*/$1)'))
    .sort()
    .join('\n')
    const ret = match[0] + results + match[3]

    return ret
  }

  str = str
  .replace(browserNameVersionRe, replaceBrowserName)
  // numbers in parenths
  .replace(/\s\(\d+([ms]|ms)\)/g, '')
  // 12:35 -> XX:XX
  .replace(/(\s+?)(\d+ms|\d+:\d+:?\d+)/g, replaceDurationInTables)
  .replace(/(coffee|js)-\d{3}/g, '$1-456')
  // Cypress: 2.1.0 -> Cypress: 1.2.3
  .replace(/(Cypress\:\s+)(\d\.\d\.\d)/g, '$11.2.3')
  // Node Version: 10.2.3 (Users/jane/node) -> Node Version: X (foo/bar/node)
  .replace(/(Node Version\:\s+v)(\d+\.\d+\.\d+)( \(.*\)\s+)/g, replaceNodeVersion)
  // 15 seconds -> X second
  .replace(/(Duration\:\s+)(\d+\sminutes?,\s+)?(\d+\sseconds?)(\s+)/g, replaceDurationSeconds)
  // duration='1589' -> duration='XXXX'
  .replace(/(duration\=\')(\d+)(\')/g, replaceDurationFromReporter)
  // (15 seconds) -> (XX seconds)
  .replace(/(\((\d+ minutes?,\s+)?\d+ seconds?\))/g, replaceParenTime)
  .replace(/\r/g, '')
  // replaces multiple lines of uploading results (since order not guaranteed)
  .replace(/(Uploading Results.*?\n\n)((.*-.*[\s\S\r]){2,}?)(\n\n)/g, replaceUploadingResults)
  // fix "Require stacks" for CI
  .replace(/^(\- )(\/.*\/packages\/server\/)(.*)$/gm, '$1$3')
  // Different browsers have different cross-origin error messages
  .replace(crossOriginErrorRe, '[Cross origin error message]')

  if (options.sanitizeScreenshotDimensions) {
    // screenshot dimensions
    str = str.replace(/(\(\d+x\d+\))/g, replaceScreenshotDims)
  }

  return replaceStackTraceLines(str)
}
