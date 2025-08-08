import { Writable } from 'stream'
import type { Debugger } from 'debug'
import { StringDecoder } from 'node:string_decoder'
import { LineDecoder } from './LineDecoder'

export class WriteToDebug extends Writable {
  private strDecoder?: StringDecoder
  private lineDecoder?: LineDecoder

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
        if (this.strDecoder && this.lineDecoder) {
          for (const line of this.lineDecoder.end()) {
            this.debugLine(line)
          }
        }

        this.strDecoder = undefined
        this.lineDecoder = undefined

        callback()
      },
    })
  }

  private debugLine (line: string) {
    // Remove trailing newline but preserve intentional whitespace
    const clean = line.endsWith('\n') ? line.slice(0, -1) : line

    if (clean) {
      this.debug(clean)
    }
  }
}
