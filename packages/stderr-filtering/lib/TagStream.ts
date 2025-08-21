import { Transform } from 'stream'
import { START_TAG, END_TAG } from './constants'
import { StringDecoder } from 'string_decoder'
import Debug from 'debug'

const debug = Debug('cypress:stderr-filtering:TagStream')

/**
 * A Transform stream that wraps input data with start and end tags.
 *
 * This stream processes incoming chunks and wraps them with configurable
 * start and end tags before passing them downstream. It handles both
 * Buffer and string inputs, using a StringDecoder for proper encoding
 * when processing Buffer chunks.
 *
 * By default, the start and end tags are the constants exported by this package:
 *  - START_TAG
 *  - END_TAG
 *
 * @example
 * ```typescript
 * const tagStream = new TagStream('[START]', '[END]');
 * tagStream.pipe(process.stdout);
 * tagStream.write('Hello World'); // Outputs: [START]Hello World[END]
 * ```
 */
export class TagStream extends Transform {
  decoder?: StringDecoder

  private get initializedDecoder () {
    debug('initializedDecoder', !!this.decoder)
    if (!this.decoder) {
      this.decoder = new StringDecoder()
    }

    return this.decoder
  }

  /**
   * Creates a new TagStream instance.
   *
   * @param startTag - The tag to prepend to each chunk. Defaults to START_TAG.
   * @param endTag - The tag to append to each chunk. Defaults to END_TAG.
   */
  constructor (private startTag: string = START_TAG, private endTag: string = END_TAG) {
    super({
      transform: (...args) => this.transform(...args),
    })
  }

  /**
   * Transforms incoming chunks by wrapping them with start and end tags.
   *
   * Processes the input chunk, handles both Buffer and string inputs,
   * and wraps the result with the configured start and end tags.
   * Implements backpressure handling by waiting for the 'drain' event
   * when the downstream stream cannot accept more data.
   *
   * @param chunk - The input chunk to transform. Can be Buffer, string, or any other type.
   * @param encoding - The encoding of the chunk (used by Transform stream).
   * @param callback - Callback function to signal completion of transformation.
   * @returns Promise that resolves when transformation is complete.
   */
  async transform (chunk: Buffer | string | any, encoding: string, callback: (error?: Error, data?: Buffer) => void) {
    try {
      const out = chunk instanceof Buffer ?
        this.initializedDecoder.write(chunk) :
        chunk
      const transformed = `${this.startTag}${out}${this.endTag}`

      debug(`transformed: "${transformed.replaceAll('\n', '\\n')}"`)
      const canWrite = this.push(out ? Buffer.from(transformed) : '')

      if (!canWrite) {
        debug('waiting for drain')
        await new Promise((resolve) => this.once('drain', resolve))
      }

      callback()
    } catch (err) {
      debug('error', err)
      callback(err as Error)
    }
  }

  /**
   * Flushes any remaining buffered data and wraps it with tags.
   *
   * Called when the stream is ending to process any remaining
   * data in the StringDecoder buffer.
   *
   * @param callback - Callback function to signal completion of flush operation.
   */
  flush (callback: (error?: Error, data?: Buffer) => void) {
    debug('flushing')
    const out = this.initializedDecoder.end()

    callback(undefined, Buffer.from(`${this.startTag}${out}${this.endTag}`))
  }
}
