import { Transform, Writable } from 'stream'
import { StringDecoder } from 'node:string_decoder'
import { LineDecoder } from './LineDecoder'
import { SplitStream } from './SplitStream'

export class FilterPrefixedContent extends Transform {
  private strDecoder?: StringDecoder
  private lineDecoder?: LineDecoder
  private splitStream: SplitStream<string>

  constructor (private prefix: RegExp, private filtered: Writable) {
    super(({
      transform: (chunk, encoding, next) => this.transform(chunk, encoding, next),
      flush: (callback) => this.flush(callback),
    }))

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
        await this.writeLine(line)
      }

      next()
    } catch (err) {
      next(err)
    }
  }

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

  private async writeLine (line: string): Promise<void> {
    if (this.prefix.test(line)) {
      await this.splitStream.writeLeft(line)
    } else {
      await this.splitStream.writeRight(line)
    }
  }
}
