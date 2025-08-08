import { Transform, Writable } from 'stream'
import { StringDecoder } from 'node:string_decoder'
import { LineDecoder } from './LineDecoder'

export class FilterPrefixedContent extends Transform {
  private strDecoder?: StringDecoder
  private lineDecoder?: LineDecoder

  constructor (private prefix: RegExp, private filtered: Writable) {
    super(({
      transform: (chunk, encoding, next) => this.transform(chunk, encoding, next),
      flush: (callback) => this.flush(callback),
    }))
  }

  transform = (chunk: Buffer, encoding: BufferEncoding, next: (err?: Error) => void) => {
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
        this.handleLine(line)
      }
    } catch (err) {
      next(err)

      return
    }
    next()
  }

  flush = (callback: (err?: Error) => void) => {
    try {
      for (const line of this.lineDecoder?.end() || []) {
        this.handleLine(line)
      }
    } catch (err) {
      callback(err)

      return
    }

    callback()
  }

  private handleLine (line: string): void {
    if (this.prefix.test(line)) {
      this.filtered.write(line)
    } else {
      this.push(line)
    }
  }
}
