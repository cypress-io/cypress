import { Transform, Writable } from 'stream'
import { StringDecoder } from 'string_decoder'
import { LineDecoder } from './LineDecoder'
import Debug from 'debug'
import { writeWithBackpressure } from './writeWithBackpressure'
const debug = Debug('cypress:stderr-filtering:FilterTaggedContent')

/**
 * Filters content based on start and end tags, supporting multi-line tagged content.
 *
 * This transform stream processes incoming data and routes content between two output streams
 * based on tag detection. Content between start and end tags is sent to the filtered stream,
 * while content outside tags is sent to the main output stream. The class handles cases where
 * tags span multiple lines by maintaining state across line boundaries.
 *
 * Example usage:
 * ```typescript
 * const filter = new FilterTaggedContent('<secret>', '</secret>', filteredStream)
 * inputStream.pipe(filter).pipe(outputStream)
 * ```
 */
export class FilterTaggedContent extends Transform {
  private strDecoder?: StringDecoder
  private lineDecoder?: LineDecoder
  private inTaggedContent: boolean = false

  /**
   * Creates a new FilterTaggedContent instance.
   *
   * @param startTag The string that marks the beginning of content to filter
   * @param endTag The string that marks the end of content to filter
   * @param filtered The writable stream for filtered content
   */
  constructor (private startTag: string, private endTag: string, private wasteStream: Writable) {
    super({
      transform: (chunk, encoding, next) => this.transform(chunk, encoding, next),
      flush: (callback) => this.flush(callback),
    })
  }

  /**
   * Processes incoming chunks and routes content based on tag detection.
   *
   * @param chunk The buffer chunk to process
   * @param encoding The encoding of the chunk
   * @param next Callback to call when processing is complete
   */
  transform = async (chunk: Buffer, encoding: BufferEncoding, next: (err?: Error) => void) => {
    try {
      this.ensureDecoders(encoding)

      const str = this.strDecoder?.write(chunk) ?? ''

      this.lineDecoder?.write(str)

      debug('processing str for tags: "%s"', str)

      for (const line of Array.from(this.lineDecoder || [])) {
        await this.processLine(line)
      }

      next()
    } catch (err) {
      next(err as Error)
    }
  }

  /**
   * Flushes any remaining buffered content when the stream ends.
   *
   * @param callback Callback to call when flushing is complete
   */
  flush = async (callback: (err?: Error) => void) => {
    debug('flushing')
    this.ensureDecoders()
    try {
      for (const line of Array.from(this.lineDecoder?.end() || [])) {
        await this.processLine(line)
      }

      callback()
    } catch (err) {
      callback(err as Error)
    }
  }

  private ensureDecoders (encoding?: BufferEncoding | 'buffer') {
    const enc = (encoding === 'buffer' ? 'utf8' : encoding) ?? 'utf8'

    if (!this.lineDecoder) {
      this.lineDecoder = new LineDecoder()
    }

    if (!this.strDecoder) {
      this.strDecoder = new StringDecoder(enc)
    }
  }

  /**
   * Processes a single line and routes content based on tag positions.
   *
   * This method handles the complex logic of detecting start and end tags within a line,
   * maintaining state across lines, and routing content to the appropriate streams.
   * It supports cases where both tags appear on the same line, only one tag appears,
   * or no tags appear but the line is part of ongoing tagged content.
   *
   * @param line The line to process
   */
  private async processLine (line: string): Promise<void> {
    const startPos = line.indexOf(this.startTag)
    const endPos = line.lastIndexOf(this.endTag)

    if (startPos >= 0 && endPos >= 0) {
      // Both tags on same line
      if (startPos > 0) {
        await this.pass(line.slice(0, startPos))
      }

      await this.writeToWasteStream(line.slice(startPos + this.startTag.length, endPos))
      if (endPos + this.endTag.length < line.length) {
        await this.pass(line.slice(endPos + this.endTag.length))
      }
    } else if (startPos >= 0) {
      // Start tag found
      if (startPos > 0) {
        await this.pass(line.slice(0, startPos))
      }

      await this.writeToWasteStream(line.slice(startPos + this.startTag.length))
      this.inTaggedContent = true
    } else if (endPos >= 0) {
      // End tag found
      await this.writeToWasteStream(line.slice(0, endPos))
      if (endPos + this.endTag.length < line.length) {
        await this.pass(line.slice(endPos + this.endTag.length))
      }

      this.inTaggedContent = false
    } else if (this.inTaggedContent) {
      // Currently in tagged content
      await this.writeToWasteStream(line)
    } else {
      // Not in tagged content
      await this.pass(line)
    }
  }

  private async writeToWasteStream (line: string, encoding?: BufferEncoding | 'buffer') {
    debug('writing to waste stream: "%s"', line)
    await writeWithBackpressure(this.wasteStream, Buffer.from(line, (encoding === 'buffer' ? 'utf8' : encoding) ?? 'utf8'))
  }

  private async pass (line: string, encoding?: BufferEncoding | 'buffer') {
    debug('passing: "%s"', line)
    this.push(Buffer.from(line, (encoding === 'buffer' ? 'utf8' : encoding) ?? 'utf8'))
  }
}
