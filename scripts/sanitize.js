// call this script to sanitize output of the command
// AFTER converting ANSI escape codes into HTML tags
const minimist = require('minimist')

// One or more adjacent HTML tags on a single line, such as `<span style="color:#0A0">`.
// Matching tag by tag keeps the patterns below linear: a greedy `<.+>` rescans the
// rest of the line from every `<` it starts at.
const TAGS = '((?:<[^<>\\n]+>)+)'
const TAG = '(<[^<>\\n]+>)'

const chromiumVersion = new RegExp(`- Version: ${TAGS}(\\d{2,3}\\.\\d\\.\\d+\\.\\d+)${TAG}`, 'g')
const firefoxVersion = new RegExp(`- Version: ${TAGS}(\\d{2,3}.\\d\\.\\d+|\\d+\\.[0-9a-z])${TAG}`, 'g')
const browserArgument = /--browser (\w+:?\w+)/g
// there is only a single line with memory usage
const systemMemory = new RegExp(`System Memory: ${TAGS}([\\w.]+ \\w+)${TAGS} free ${TAGS}([\\w.]+ \\w+)${TAG}`)

const replaceChromiumVersion = (match, openTag, version, closeTag) => {
  return `- Version: ${openTag}***chromium version***${closeTag}`
}

const replaceFirefoxVersion = (match, openTag, version, closeTag) => {
  return `- Version: ${openTag}***firefox version***${closeTag}`
}

const replaceBrowserArgument = (match, browserName) => {
  return '--browser ***name:channel***'
}

const replaceSystemMemory = (match, tag1, total, tag2, tag3, free, tag4) => {
  return `System Memory: ${tag1}***total memory***${tag2} free ${tag3}***free memory***${tag4}`
}

const sanitizeCliInfo = (chunk) => {
  return chunk.replace(chromiumVersion, replaceChromiumVersion)
  .replace(firefoxVersion, replaceFirefoxVersion)
  .replace(browserArgument, replaceBrowserArgument)
  .replace(systemMemory, replaceSystemMemory)
}

const sanitizeStdin = (sanitize) => {
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', function (chunk) {
    return process.stdout.write(sanitize(chunk))
  })
}

module.exports = {
  sanitizeCliInfo,
}

if (require.main === module) {
  const args = minimist(process.argv.slice(2), {
    string: ['cli-info'],
  })

  switch (args.type) {
    case 'cli-info':
      sanitizeStdin(sanitizeCliInfo)
      break
    default:
      throw new Error(`Unknown STDOUT type to sanitize "${args.type}"`)
  }
}
