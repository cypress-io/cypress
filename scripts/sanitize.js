// call this script to sanitize output of the command
// AFTER converting ANSI escape codes into HTML tags
const minimist = require('minimist')

const args = minimist(process.argv.slice(2), {
  string: ['cli-info'],
})

const sanitizeCliInfo = () => {
  const chromiumVersion = /- Version: (<.+>)(\d{2,3}.\d\.\d+.\d+)(<.+>)/g
  const firefoxVersion = /- Version: (<.+>)(\d{2,3}.\d\.\d+|\d+\.[0-9a-z])(<.+>)+/g
  const browserArgument = /--browser (\w+:?\w+)/g
  // there is only a single line with memory usage
  const systemMemory = /System Memory: (<.+>)([\w.]+ \w+)(<.+>) free (<.+>)([\w.]+ \w+)(<.+>)/

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

  const sanitize = (chunk) => {
    return chunk.replace(chromiumVersion, replaceChromiumVersion)
    .replace(firefoxVersion, replaceFirefoxVersion)
    .replace(browserArgument, replaceBrowserArgument)
    .replace(systemMemory, replaceSystemMemory)
  }

  process.stdin.setEncoding('utf8')
  process.stdin.on('data', function (chunk) {
    return process.stdout.write(sanitize(chunk))
  })
}

switch (args.type) {
  case 'cli-info':
    sanitizeCliInfo()
    break
  default:
    throw new Error(`Unknown STDOUT type to sanitize "${args.type}"`)
}
