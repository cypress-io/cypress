import { Transform, Writable } from 'stream'
import { StringDecoder } from 'node:string_decoder'
import { LineDecoder } from './LineDecoder'

export class FilterTaggedContent extends Transform {
  private strDecoder?: StringDecoder
  private lineDecoder?: LineDecoder
  private inTaggedContent: boolean = false

  constructor (private startTag: string, private endTag: string, private filtered: Writable) {
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
    try {
      for (const line of this.lineDecoder?.end() || []) {
        this.handleLine(line)
      }
    } catch (err) {
      callback(err)
    }
    callback()
  }

  private handleLine (line: string): void {
    const startPos = line.indexOf(this.startTag)
    const endPos = line.lastIndexOf(this.endTag)

    if (startPos >= 0 && endPos >= 0) {
      this.push(line.slice(0, startPos))
      this.push(line.slice(endPos + this.endTag.length))
      this.filtered.write(line.slice(startPos, endPos + this.endTag.length))
    } else if (startPos >= 0) {
      this.filtered.write(line.slice(startPos))
      this.push(line.slice(0, startPos))
      this.inTaggedContent = true
    } else if (endPos >= 0) {
      this.filtered.write(line.slice(0, endPos))
      this.push(line.slice(endPos + this.endTag.length))
      this.inTaggedContent = false
    } else if (this.inTaggedContent) {
      this.filtered.write(line)
    } else {
      this.push(line)
    }
  }
}
