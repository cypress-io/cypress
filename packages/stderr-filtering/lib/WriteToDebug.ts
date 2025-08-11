import { Writable } from 'stream'
import type { Debugger } from 'debug'
import { StringDecoder } from 'node:string_decoder'
import { LineDecoder } from './LineDecoder'

/**
 * A writable stream that routes incoming data to a debug logger.
 *
 * This class extends Writable to provide a stream interface that processes incoming
 * data and forwards it to a debug logger. It handles line-by-line processing and
 * automatically manages string decoding and line buffering. The stream is useful
 * for debugging purposes where you want to log stream data with proper line handling.
 *
 * Example usage:
 * ```typescript
 * const debug = require('debug')('myapp:stream')
 * const debugStream = new WriteToDebug(debug)
 * someStream.pipe(debugStream)
 * ```
 */
export class WriteToDebug extends Writable {
  private strDecoder?: StringDecoder
  private lineDecoder?: LineDecoder

  /**
   * Creates a new WriteToDebug instance.
   *
   * @param debug The debug logger instance to write output to
   */
  constructor (private debug: Debugger) {
    super({
      write: (chunk, encoding, next) => {
        if (!this.strDecoder) {
          // @ts-expect-error type here is not correct, 'buffer' is not a valid encoding but it does get passed in
          this.strDecoder = new StringDecoder(encoding === 'buffer' ? 'utf8' : encoding)
        }

        if (!this.lineDecoder) {
          this.lineDecoder = new LineDecoder()
        }

        const str = this.strDecoder.write(chunk)

        this.lineDecoder.write(str)

        for (const line of this.lineDecoder) {
          this.debugLine(line)
        }

        next()
      },
      final: (callback) => {
        if (!this.strDecoder) {
          this.strDecoder = new StringDecoder()
        }

        if (!this.lineDecoder) {
          this.lineDecoder = new LineDecoder()
        }

        for (const line of this.lineDecoder.end()) {
          this.debugLine(line)
        }

        this.strDecoder = undefined
        this.lineDecoder = undefined

        callback()
      },
    })
  }

  /**
   * Processes a single line and sends it to the debug logger.
   *
   * This method cleans the line by removing trailing newlines while preserving
   * intentional whitespace, then sends non-empty lines to the debug logger.
   * Empty lines are filtered out to avoid cluttering the debug output.
   *
   * @param line The line to process and log
   */
  private debugLine (line: string) {
    // Remove trailing newline but preserve intentional whitespace
    const clean = line.endsWith('\n') ? line.slice(0, -1) : line

    if (clean) {
      this.debug(clean)
    }
  }
}
