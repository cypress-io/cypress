import { Transform, Writable } from 'stream'
import { StringDecoder } from 'node:string_decoder'
import { LineDecoder } from './LineDecoder'

export class FilterPrefixedContent extends Transform {
  private strDecoder?: StringDecoder
  private lineDecoder?: LineDecoder

  constructor (private prefix: RegExp, private filtered: Writable) {
    super()
  }

  transform (chunk: Buffer, encoding: BufferEncoding, next: (err?: Error) => void) {
    try {
      if (!this.strDecoder) {
        this.strDecoder = new StringDecoder(encoding)
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
    }
    next()
  }

  flush (callback: (err?: Error) => void) {
    for (const line of this.lineDecoder?.end() || []) {
      this.handleLine(line)
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
