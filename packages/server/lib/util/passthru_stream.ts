import { Transform } from 'stream'

const through = require('through')

export function passthruStream (): Transform {
  return through(function (this: InternalStream, chunk) {
    this.queue(chunk)
  })
}
