import { Transform, Writable } from 'stream'
import { StringDecoder } from 'node:string_decoder'
import { LineDecoder } from './LineDecoder'
import { SplitStream } from './SplitStream'

/**
 * Filters content based on a prefix pattern, routing matching lines to a filtered stream.
 *
 * This transform stream processes incoming data line by line and routes content between two
 * output streams based on a regular expression prefix test. Lines that match the prefix pattern
 * are sent to the filtered stream, while non-matching lines are sent to the main output stream.
 *
 * Example usage:
 * ```typescript
 * const errorStream = new Writable()
 * const filter = new FilterPrefixedContent(/^ERROR:/, errorStream)
 * inputStream.pipe(filter).pipe(outputStream)
 * ```
 */
export class FilterPrefixedContent extends Transform {
  private strDecoder?: StringDecoder
  private lineDecoder?: LineDecoder
  private splitStream: SplitStream<string>

  /**
   * Creates a new FilterPrefixedContent instance.
   *
   * @param prefix The regular expression pattern to test against the beginning of each line
   * @param filtered The writable stream for lines that match the prefix pattern
   */
  constructor (private prefix: RegExp, private filtered: Writable) {
    super(({
      transform: (chunk, encoding, next) => this.transform(chunk, encoding, next),
      flush: (callback) => this.flush(callback),
    }))

    this.splitStream = new SplitStream(this.filtered, this)
  }

  /**
   * Processes incoming chunks and routes lines based on prefix matching.
   *
   * @param chunk The buffer chunk to process
   * @param encoding The encoding of the chunk
   * @param next Callback to call when processing is complete
   */
  transform = async (chunk: Buffer, encoding: BufferEncoding, next: (err?: Error) => void) => {
    try {
      if (!this.strDecoder) {
        // @ts-expect-error type here is not correct, 'buffer' is not a valid encoding but it does get passed in
        this.strDecoder = new StringDecoder(encoding === 'buffer' ? 'utf8' : encoding)
      }

      if (!this.lineDecoder) {
        this.lineDecoder = new LineDecoder()
      }

      this.lineDecoder.write(this.strDecoder.write(chunk))

      for (const line of this.lineDecoder) {
        await this.writeLine(line)
      }

      next()
    } catch (err) {
      next(err)
    }
  }

  /**
   * Flushes any remaining buffered content when the stream ends.
   *
   * @param callback Callback to call when flushing is complete
   */
  flush = async (callback: (err?: Error) => void) => {
    try {
      for (const line of this.lineDecoder?.end() || []) {
        await this.writeLine(line)
      }

      callback()
    } catch (err) {
      callback(err)
    }
  }

  /**
   * Routes a single line to the appropriate stream based on prefix matching.
   *
   * Tests the line against the prefix regular expression and routes it to either
   * the filtered stream (if it matches) or the main output stream (if it doesn't match).
   *
   * @param line The line to test and route
   */
  private async writeLine (line: string): Promise<void> {
    if (this.prefix.test(line)) {
      await this.splitStream.writeLeft(line)
    } else {
      await this.splitStream.writeRight(line)
    }
  }
}
