import _ from 'lodash'
import _concatStream from 'concat-stream'

type Callback = (buf: Buffer) => void
type ConcatOpts = {
  encoding?: string
}

/**
 * Wrapper for `concat-stream` to handle empty streams.
 */
export const concatStream: typeof _concatStream = function (opts: Callback | ConcatOpts, cb?: Callback) {
  let _cb: Callback = cb!

  if (!_cb) {
    _cb = opts as Callback
    opts = {}
  }

  return _concatStream(opts as ConcatOpts, function (buf: Buffer) {
    if (!_.get(buf, 'length')) {
      // concat-stream can give an empty array if the stream has
      // no data - just call the callback with an empty buffer
      return _cb(Buffer.from(''))
    }

    return _cb(buf)
  })
}
