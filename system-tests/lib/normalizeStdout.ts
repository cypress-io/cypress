import Fixtures from './fixtures'
import _ from 'lodash'

export const e2ePath = Fixtures.projectPath('e2e')

export const DEFAULT_BROWSERS = ['electron', 'chrome', 'firefox', 'webkit']

export const pathUpToProjectName = Fixtures.projectPath('')

export const browserNameVersionRe = /(Browser\:\s+)(Custom |)(Electron|Chrome|Canary|Chromium|Firefox|WebKit)(\s\d+)(\s\(\w+\))?(\s+)/

const availableBrowsersRe = /(Available browsers found on your system are:)([\s\S]+)/g
const crossOriginErrorRe = /(Blocked a frame .* from accessing a cross-origin frame.*|Permission denied.*cross-origin object.*)/gm
const whiteSpaceBetweenNewlines = /\n\s+\n/
const retryDuration = /Timed out retrying after (\d+)ms/g
const escapedRetryDuration = /TORA(\d+)/g

export const STDOUT_DURATION_IN_TABLES_RE = /(\s+?)(\d+ms|\d+:\d+:?\d+)/g

const replaceBrowserName = function (str: string, key: string, customBrowserPath: string, browserName: string, version: string, headless: boolean, whitespace: string) {
  // get the padding for the existing browser string
  const lengthOfExistingBrowserString = _.sum([browserName.length, version.length, _.get(headless, 'length', 0), whitespace.length])

  // this ensures we add whitespace so the border is not shifted
  return key + customBrowserPath + _.padEnd('FooBrowser 88', lengthOfExistingBrowserString)
}

const replaceDurationSeconds = function (str: string, p1: string, p2: string, p3: string, p4: string) {
  // get the padding for the existing duration
  const lengthOfExistingDuration = _.sum([(p2 != null ? p2.length : undefined) || 0, p3.length, p4.length])

  return p1 + _.padEnd('X seconds', lengthOfExistingDuration)
}

// duration='1589'
const replaceDurationFromReporter = (str: string, p1: string, p2: string, p3: string) => {
  return p1 + _.padEnd('X', p2.length, 'X') + p3
}

const replaceShortDuration = (str: string, prefix: string, p2: string, p3: string, p4: string, count: string): string => {
  return `${prefix} Xm, Ys ZZ.ZZms ${count}`
}

const replaceNodeVersion = (str: string, p1: string, p2: string, p3: string) => {
  // Accounts for paths that break across lines
  const p3Length = p3.includes('\n') ? p3.split('\n')[0].length - 1 : p3.length

  return _.padEnd(`${p1}X (/foo/bar/node)`, (p1.length + p2.length + p3Length))
}

const replaceCypressVersion = (str: string, p1: string, p2: string) => {
  // Cypress: 12.10.10 -> Cypress: 1.2.3 (handling padding)
  return _.padEnd(`${p1}1.2.3`, (p1.length + p2.length))
}

// when swapping out the duration, ensure we pad the
// full length of the duration so it doesn't shift content
const replaceDurationInTables = (str: string, p1: string, p2: string) => {
  return _.padStart('XX:XX', p1.length + p2.length)
}

// since time lives on it's own line
// we can replace the time with 'X second(s)' and pad the length of the expected string.
// This accounts for the test taking 1 second, X seconds, or XX seconds, and so on.
const replaceTime = (str: string, p1: string) => {
  return _.padEnd('X second(s)', p1.length)
}

const replaceScreenshotDims = (str: string, p1: string) => _.padStart('(YxX)', p1.length)

const replaceUploadingResults = function (orig: string, ...rest: string[]) {
  const adjustedLength = Math.max(rest.length, 2)
  const match = rest.slice(0, adjustedLength - 2)
  const results = match[1].split('\n').map((res) => res.replace(/\(\d+\/(\d+)\)/g, '(*/$1)'))
  .sort()
  .join('\n')
  const ret = match[0] + results + match[3]

  return ret
}

// this captures an entire stack trace and replaces it with [stack trace lines]
// so that the stdout can contain stack traces of different lengths
export const replaceStackTraceLines = (str: string, browserName: 'electron' | 'firefox' | 'chrome' | 'webkit') => {
  // matches the newline preceding the stack and any leading whitespace
  const leadingNewLinesAndWhitespace = `(?:\\n?[^\\S\\n\\r]*)`
  // matches against the potential file location patterns, including:
  // foo.js:1:2 - file locations including line/column numbers
  // <unknown> - rendered when location cannot be determined
  // [native code] - rendered in some cases by WebKit browser
  const location = `(?:.*:\\d+:\\d+|<unknown>|\\[native code\\])`
  // matches stack lines with Chrome-style rendering:
  // '  at foobar (foo.js:1:2)'
  // '  at foo.js:1:2'
  const verboseStyleLine = `at\\s.*(?::\\d+:\\d+|\\s\\(${location}\\))`
  // matches stack lines with Firefox/WebKit style rendering:
  // '  foobar@foo.js:1:2'
  const condensedStyleLine = `.*@${location}`
  // matches against remainder of stack trace until blank lines found.
  // includes group to normalize whitespace between newlines in Firefox
  const remainderOfStack = `[\\n\\S\\s]*?(\\n\\s*?\\n|$)`

  const stackTraceRegex = new RegExp(`${leadingNewLinesAndWhitespace}(?:${verboseStyleLine}|${condensedStyleLine})${remainderOfStack}`, 'g')

  return str.replace(stackTraceRegex, (match: string, ...parts: string[]) => {
    let post = parts[0]

    if (browserName === 'firefox') {
      post = post.replace(whiteSpaceBetweenNewlines, '\n')
    }

    return `\n      [stack trace lines]${post}`
  })
}

export const normalizeStdout = function (str: string, options: any = {}) {
  const { normalizeStdoutAvailableBrowsers } = options

  // remove all of the dynamic parts of stdout
  // to normalize against what we expected
  str = str
  // /Users/jane/........../ -> //foo/bar/.projects/
  // (Required when paths are printed outside of our own formatting)
  .split(pathUpToProjectName).join('/foo/bar/.projects')

  // unless normalization is explicitly turned off then
  // always normalize the stdout replacing the browser text
  if (normalizeStdoutAvailableBrowsers !== false) {
    // usually we are not interested in the browsers detected on this particular system
    // but some tests might filter / change the list of browsers
    // in that case the test should pass "normalizeStdoutAvailableBrowsers: false" as options
    str = str.replace(availableBrowsersRe, '$1\n- browser1\n- browser2\n- browser3')
  }

  str = str
  .replace(browserNameVersionRe, replaceBrowserName)
  // numbers in parenths
  .replace(/\s\(\d+([ms]|ms)\)/g, '')
  // escape "Timed out retrying" messages
  .replace(retryDuration, 'TORA$1')
  // 12:35 -> XX:XX
  .replace(STDOUT_DURATION_IN_TABLES_RE, replaceDurationInTables)
  // restore "Timed out retrying" messages
  .replace(escapedRetryDuration, 'Timed out retrying after $1ms')
  .replace(/(coffee|js)-\d{3}/g, '$1-456')
  // Cypress: 2.1.0 -> Cypress: 1.2.3
  .replace(/(Cypress\:\s+)(\d+\.\d+\.\d+)/g, replaceCypressVersion)
  // Node Version: 10.2.3 (Users/jane/node) -> Node Version: X (foo/bar/node)
  .replace(/(Node Version\:\s+v)(\d+\.\d+\.\d+)( \((?:.|\n)*?\)\s+)/g, replaceNodeVersion)
  // 15 seconds -> X second
  .replace(/(Duration\:\s+)(\d+\sminutes?,\s+)?(\d+\sseconds?)(\s+)/g, replaceDurationSeconds)
  // duration='1589' -> duration='XXXX'
  .replace(/(duration\=\')(\d+)(\')/g, replaceDurationFromReporter)
  // (in|after) (1m)|(1m, 10s)|(10s)|(10.12ms) 1/1 => '(in|after) XXm, YYs, ZZ.ZZms 1/1
  .replace(/((in)|(after)) ((?:\d+m)|(?:\d+m, \d+s)|(?:\d+s)|(?:\d+\.\d+ms)) (\d+\/\d+)/g, replaceShortDuration)
  // 15 seconds -> XX seconds
  .replace(/((\d+ minutes?,\s+)?\d+ seconds? *)/g, replaceTime)
  .replace(/\r/g, '')
  // replaces multiple lines of uploading screenshots & results (since order not guaranteed)
  .replace(/(Uploading Screenshots & Videos.*?\n\n)((.*-.*[\s\S\r]){2,}?)(\n\n)/g, replaceUploadingResults)
  // fix "Require stacks" for CI
  .replace(/^(\- )(\/.*\/packages\/server\/)(.*)$/gm, '$1$3')
  // Different browsers have different cross-origin error messages
  .replace(crossOriginErrorRe, '[Cross origin error message]')
  // Replaces connection warning since Chrome or Firefox sometimes take longer to connect
  .replace(/Still waiting to connect to .+, retrying in 1 second \(attempt .+\/.+\)\n/g, '')

  if (options.browser === 'webkit') {
    // WebKit throws for lookups on undefined refs with "Can't find variable: <var>"
    // This message is replaced with Chrome/Firefox's exception text for consistent diffs
    str = str.replace(/(ReferenceError:|>) Can\'t find variable: (\S+)/g, '$1 $2 is not defined')
  }

  // avoid race condition when webpack prints this at a non-deterministic timing
  const wdsFailedMsg = 'ℹ ｢wdm｣: Failed to compile.'

  if (str.includes(wdsFailedMsg)) {
    str = str.split('\n').filter((line) => !line.includes(wdsFailedMsg)).join('\n')
  }

  if (options.sanitizeScreenshotDimensions) {
    // screenshot dimensions
    str = str.replace(/(\(\d+x\d+\))/g, replaceScreenshotDims)
  }

  return replaceStackTraceLines(str, options.browser)
}
