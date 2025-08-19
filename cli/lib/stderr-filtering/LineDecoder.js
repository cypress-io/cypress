'use strict'
/**
 * Decodes incoming string chunks into complete lines, handling partial lines across chunk boundaries.
 *
 * This class buffers incoming string data and provides an iterator interface to yield complete
 * lines. It handles the case where a line might be split across multiple chunks by maintaining
 * an internal buffer. The end() method should be called to flush any remaining buffered content
 * when processing is complete.
 */
let __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod }
}

Object.defineProperty(exports, '__esModule', { value: true })
exports.LineDecoder = void 0

const debug_1 = __importDefault(require('debug'))
const constants_1 = require('./constants')
const debug = (0, debug_1.default)(`cypress:stderr-filtering:LineDecoder:${process.pid}`)

class LineDecoder {
  constructor (overrideToken = constants_1.END_TAG) {
    this.overrideToken = overrideToken
    this.buffer = ''
  }
  /**
     * Adds a chunk of string data to the internal buffer.
     *
     * @param chunk The string chunk to add to the buffer
     */
  write (chunk) {
    debug('writing chunk to line decoder', { chunk })
    this.buffer += chunk
  }
  /**
     * Iterates over complete lines in the current buffer.
     *
     * This generator yields complete lines from the buffer, splitting on newline characters.
     * Any incomplete line at the end of the buffer is kept for the next iteration.
     * Handles both Windows (\r\n) and Unix (\n) line endings.
     *
     * @yields Complete lines with newline characters preserved
     */
  *[Symbol.iterator] () {
    debug('iterating over lines in line decoder')
    let nextLine = undefined

    do {
      nextLine = this.nextLine()
      if (nextLine) {
        debug('yielding line:', nextLine)
        debug('buffer size:', this.buffer.length)
        yield nextLine
      }
    } while (nextLine)
  }
  /**
     * Flushes the remaining buffer content and yields all remaining lines.
     *
     * This method should be called when processing is complete to ensure all buffered
     * content is yielded. It processes any remaining content in the buffer plus an
     * optional final chunk. Handles both Windows (\r\n) and Unix (\n) line endings.
     *
     * @param chunk Optional final chunk to process along with the buffer
     * @yields All remaining lines from the buffer and final chunk
     */
  *end (chunk) {
    this.buffer = `${this.buffer}${(chunk || '')}`
    let nextLine = undefined

    do {
      nextLine = this.nextLine()
      if (nextLine) {
        yield nextLine
      }
    } while (nextLine)
  }
  nextLine () {
    const [newlineIndex, length] = [this.buffer.indexOf('\n'), 1]
    const endsWithOverrideToken = newlineIndex < 0 ? this.buffer.endsWith(this.overrideToken) : false

    if (endsWithOverrideToken) {
      debug('ends with override token')
      const line = this.buffer

      this.buffer = ''

      return line
    }

    if (newlineIndex >= 0) {
      debug('contains a newline')
      const line = this.buffer.slice(0, newlineIndex + length)

      this.buffer = this.buffer.slice(newlineIndex + length)

      return line
    }

    return undefined
  }
}
exports.LineDecoder = LineDecoder
