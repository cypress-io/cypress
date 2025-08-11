import { Transform, Writable } from 'stream'
import { StringDecoder } from 'node:string_decoder'
import { LineDecoder } from './LineDecoder'
import { SplitStream } from './SplitStream'

export class FilterTaggedContent extends Transform {
  private strDecoder?: StringDecoder
  private lineDecoder?: LineDecoder
  private inTaggedContent: boolean = false
  private splitStream: SplitStream<string>

  constructor (private startTag: string, private endTag: string, private filtered: Writable) {
    super({
      transform: (chunk, encoding, next) => this.transform(chunk, encoding, next),
      flush: (callback) => this.flush(callback),
    })

    this.splitStream = new SplitStream(this.filtered, this)
  }

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
        await this.processLine(line)
      }

      next()
    } catch (err) {
      next(err)
    }
  }

  flush = async (callback: (err?: Error) => void) => {
    try {
      for (const line of this.lineDecoder?.end() || []) {
        await this.processLine(line)
      }

      callback()
    } catch (err) {
      callback(err)
    }
  }

  private async processLine (line: string): Promise<void> {
    const startPos = line.indexOf(this.startTag)
    const endPos = line.lastIndexOf(this.endTag)

    if (startPos >= 0 && endPos >= 0) {
      // Both tags on same line
      if (startPos > 0) {
        await this.splitStream.writeRight(line.slice(0, startPos))
      }

      await this.splitStream.writeLeft(line.slice(startPos, endPos + this.endTag.length))
      if (endPos + this.endTag.length < line.length) {
        await this.splitStream.writeRight(line.slice(endPos + this.endTag.length))
      }
    } else if (startPos >= 0) {
      // Start tag found
      if (startPos > 0) {
        await this.splitStream.writeRight(line.slice(0, startPos))
      }

      await this.splitStream.writeLeft(line.slice(startPos))
      this.inTaggedContent = true
    } else if (endPos >= 0) {
      // End tag found
      await this.splitStream.writeLeft(line.slice(0, endPos + this.endTag.length))
      if (endPos + this.endTag.length < line.length) {
        await this.splitStream.writeRight(line.slice(endPos + this.endTag.length))
      }

      this.inTaggedContent = false
    } else if (this.inTaggedContent) {
      // Currently in tagged content
      await this.splitStream.writeLeft(line)
    } else {
      // Not in tagged content
      await this.splitStream.writeRight(line)
    }
  }
}
