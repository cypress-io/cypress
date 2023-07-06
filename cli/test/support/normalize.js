const stripAnsi = require('strip-ansi')

// source: https://www.myintervals.com/blog/2009/05/20/iso-8601-date-validation-that-doesnt-suck/
const isoDateRegex = /"([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?"/g
const numberRegex = /"(duration|totalDuration|port)": \d+/g
const osNameRegex = /"(osName|platform)": "[^"]+"/g
const archRegex = /"arch": "[^"]+"/g
const versionRegex = /"(browserVersion|cypressVersion|osVersion|resolvedNodeVersion|version)": "[0-9.]+"/g
const majorVersionRegex = /"(majorVersion)": [0-9]+/g
const pathRegex = /"(absolute|projectRoot|downloadsFolder|fileServerFolder|fixturesFolder|resolvedNodePath|screenshotsFolder|videosFolder|cypressBinaryRoot|path)": "[^"]+"/g

/**
 * normalize dynamic data in results json like dates, paths, durations, etc
 * @param {string} resultsJson input string
 * @returns {string} cleaned output string
 */
const normalizeResults = (resultsJson) => {
  return resultsJson
  .replace(isoDateRegex, '"2015-03-18T00:00:00.000Z"')
  .replace(numberRegex, '"$1": 100')
  .replace(pathRegex, '"$1": "/path/to/$1"')
  .replace(versionRegex, '"$1": "X.Y.Z"')
  .replace(majorVersionRegex, '"$1": "X"')
  .replace(osNameRegex, '"$1": "linux"')
  .replace(archRegex, '"arch": "x64"')
}

const whitespaceAtEndOfLineRe = /\s+$/g
const datesRe = /(\d+:\d+:\d+)/g
const downloadQueryRe = /(\?platform=(darwin|linux|win32)&arch=x64)/

const removeExcessWhiteSpace = (str) => {
  return str.replace(whitespaceAtEndOfLineRe, '')
}

/**
 * normalize dates, ansi codes, and excess whitespace from stdout
 * @param {string} str input string
 * @returns {string} cleaned output string
 */
const normalizeStdout = (str) => {
  return stripAnsi(
    str
    .replace(datesRe, 'xx:xx:xx')
    .split('\n')
    .map(removeExcessWhiteSpace)
    .join('\n')
    .replace(downloadQueryRe, '?platform=OS&arch=ARCH'),
  )
}

module.exports = {
  normalizeResults,
  normalizeStdout,
}
