const stripAnsi = require('strip-ansi')

const whitespaceAtEndOfLineRe = /\s+$/g
const datesRe = /(\d+:\d+:\d+)/g
const downloadQueryRe = /(\?platform=(darwin|linux|win32)&arch=x64)/

const removeExcessWhiteSpace = (str) => {
  return str.replace(whitespaceAtEndOfLineRe, '')
}

/**
 * strip dates and ansi codes and excess whitespace
 * @param {string} str input string
 * @returns {string} cleaned output string
 */
const normalize = (str) => {
  return stripAnsi(
    str
    .replace(datesRe, 'xx:xx:xx')
    .split('\n')
    .map(removeExcessWhiteSpace)
    .join('\n')
    .replace(downloadQueryRe, '?platform=OS&arch=ARCH'),
  )
}

module.exports = normalize
