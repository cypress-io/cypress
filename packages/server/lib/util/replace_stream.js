const GraphemeSplitter = require('grapheme-splitter')
const through = require('through')

const splitter = new GraphemeSplitter()

// UTF-8 grapheme aware stream replacer
// https://github.com/cypress-io/cypress/pull/4984
function replaceStream (pattern, replacement, options = { maxTailLength: 100 }) {
  let tail = ''

  return through(function write (chunk) {
    chunk = chunk.toString('utf8')

    tail = tail + chunk
    tail = tail.replace(pattern, replacement)

    // if we're overflowing max chars, emit the overflow at the beginning
    if (tail.length > options.maxTailLength) {
      // the maximum width of a unicode char is 4
      // use grapheme-splitter to find a good breaking point
      const breakableAt = splitter.nextBreak(tail, Math.max(0, tail.length - options.maxTailLength - 4))

      this.queue(tail.slice(0, breakableAt))

      tail = tail.slice(breakableAt)
    } else {
      this.queue('')
    }
  }, function end () {
    if (tail.length) {
      this.queue(tail)
    }

    this.queue(null)
  })
}

module.exports = {
  replaceStream,
}
