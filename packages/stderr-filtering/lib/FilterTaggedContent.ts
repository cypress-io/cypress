import type { Writable } from 'stream'
import { Transform } from 'stream'
import { StringDecoder } from 'string_decoder'
import { LineDecoder } from './LineDecoder'
import Debug from 'debug'
import { writeWithBackpressure } from './writeWithBackpressure'
const debugVerbose = Debug('cypress-verbose:stderr-filtering:FilterTaggedContent')

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

      debugVerbose('processing str for tags: "%s"', str)

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
    debugVerbose('flushing')
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
   * Tags are consumed left to right, so a line may contain any number of tagged
   * regions in any order, e.g. `<end><start>text\n` when consecutive tagged writes
   * are read as a single chunk. Tagged state carries across lines.
   *
   * @param line The line to process
   */
  private async processLine (line: string): Promise<void> {
    let rest = line

    do {
      const endPos = rest.indexOf(this.endTag)

      if (this.inTaggedContent) {
        if (endPos < 0) {
          await this.writeToWasteStream(rest)

          return
        }

        if (endPos > 0) {
          await this.writeToWasteStream(rest.slice(0, endPos))
        }

        this.inTaggedContent = false
        rest = rest.slice(endPos + this.endTag.length)
        continue
      }

      const startPos = rest.indexOf(this.startTag)

      // An end tag without a preceding start tag closes content whose start was not seen
      if (endPos >= 0 && (startPos < 0 || endPos < startPos)) {
        if (endPos > 0) {
          await this.writeToWasteStream(rest.slice(0, endPos))
        }

        rest = rest.slice(endPos + this.endTag.length)
        continue
      }

      if (startPos < 0) {
        await this.pass(rest)

        return
      }

      if (startPos > 0) {
        await this.pass(rest.slice(0, startPos))
      }

      this.inTaggedContent = true
      rest = rest.slice(startPos + this.startTag.length)
    } while (rest.length > 0)
  }

  private async writeToWasteStream (line: string, encoding?: BufferEncoding | 'buffer') {
    debugVerbose('writing to waste stream: "%s"', line)
    await writeWithBackpressure(this.wasteStream, Buffer.from(line, (encoding === 'buffer' ? 'utf8' : encoding) ?? 'utf8'))
  }

  private async pass (line: string, encoding?: BufferEncoding | 'buffer') {
    debugVerbose('passing: "%s"', line)
    this.push(Buffer.from(line, (encoding === 'buffer' ? 'utf8' : encoding) ?? 'utf8'))
  }
}
