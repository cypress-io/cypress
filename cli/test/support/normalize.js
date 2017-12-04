const stripAnsi = require('strip-ansi')

const whitespaceAtEndOfLineRe = /\s+$/g
const datesRe = /(\d+:\d+:\d+)/g
const downloadQueryRe = /(\?platform=(darwin|linux|win32)&arch=(x64|ia32))/

const removeExcessWhiteSpace = (str) => {
  return str.replace(whitespaceAtEndOfLineRe, '')
}

module.exports = (str) => {
  // strip dates and ansi codes
  // and excess whitespace
  return stripAnsi(
    str
    .replace(datesRe, 'xx:xx:xx')
    .split('\n')
    .map(removeExcessWhiteSpace)
    .join('\n')
    .replace(downloadQueryRe, '?platform=OS&arch=ARCH')
  )
}
