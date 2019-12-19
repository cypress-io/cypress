import through from 'through'

const GraphemeSplitter = require('grapheme-splitter')

interface IGraphemeSplitter {
  nextBreak: (string: string, at: number) => number
}

const splitter: IGraphemeSplitter = new GraphemeSplitter()

/**
 * UTF-8 grapheme aware stream replacer
 * https://github.com/cypress-io/cypress/pull/4984
 */
export function replaceStream (patterns: RegExp | RegExp[], replacements: string | string[], options = { maxTailLength: 100 }) {
  if (!Array.isArray(patterns)) {
    patterns = [patterns]
  }

  if (!Array.isArray(replacements)) {
    replacements = [replacements]
  }

  let tail = ''

  return through(function write (this: InternalStream, chunk) {
    let emitted = false

    const emitTailUpTo = (index) => {
      emitted = true
      this.queue(tail.slice(0, index))
      tail = tail.slice(index)
    }

    chunk = chunk.toString('utf8')

    tail = tail + chunk

    let replacementEndIndex = 0

    ;(patterns as RegExp[]).forEach((pattern, i) => {
      const replacement = replacements[i]

      tail = tail.replace(pattern, function replacer (match) {
        // ugly, but necessary due to bizarre function signature of String#replace
        const offset = arguments[arguments.length - 2] // eslint-disable-line prefer-rest-params

        if (offset + replacement.length > replacementEndIndex) {
          replacementEndIndex = offset + replacement.length
        }

        return match.replace(pattern, replacement)
      })
    })

    // if a replacement did occur, we should emit up to the end of what was replaced
    if (replacementEndIndex) {
      emitTailUpTo(replacementEndIndex)
    }

    // if we're overflowing max chars, emit the overflow at the beginning
    if (tail.length > options.maxTailLength) {
      // the maximum width of a unicode char is 4
      // use grapheme-splitter to find a good breaking point
      const breakableAt = splitter.nextBreak(tail, Math.max(0, tail.length - options.maxTailLength - 4))

      emitTailUpTo(breakableAt)
    }

    if (!emitted) {
      // this.queue('')
    }
  }, function end (this: InternalStream) {
    if (tail.length) {
      this.queue(tail)
    }

    this.queue(null)
  })
}
