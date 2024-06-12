import _ from 'lodash'
import debugModule from 'debug'
import stream from 'stream'

const debug = debugModule('cypress:server:stream_buffer')

function streamBuffer (initialSize = 2048) {
  let buffer: Buffer | null = Buffer.allocUnsafe(initialSize)
  let bytesWritten = 0
  let finished = false

  const onWrite = (chunk, enc, cb) => {
    if (finished || !chunk || !buffer) {
      debug('received write after deleting buffer, ignoring %o', { chunkLength: chunk && chunk.length, enc })

      return cb()
    }

    if (chunk.length + bytesWritten > buffer.length) {
      let newBufferLength = buffer.length

      while (newBufferLength < chunk.length + bytesWritten) {
        newBufferLength *= 2
      }

      debug('extending buffer to accommodate new chunk', {
        bufferLength: buffer.length,
        newBufferLength,
      })

      const newBuffer = Buffer.allocUnsafe(newBufferLength)

      buffer.copy(newBuffer)
      buffer = newBuffer
    }

    debug('appending chunk to buffer %o', { bytesWritten, chunkLength: chunk.length })

    bytesWritten += chunk.copy(buffer, bytesWritten)

    // emit in case there are readers waiting
    writeable.emit('chunk', chunk)

    cb()
  }

  const onFinal = (cb) => {
    debug('stream buffer writeable final called')
    finished = true
    cb()
  }

  class StreamBuffer extends stream.Writable {
    private readers: stream.Readable[] = []

    public createReadStream () {
      let bytesRead = 0
      const readerId = _.uniqueId('reader')

      const onRead = (size) => {
        if (!buffer) {
          debug('read requested after unpipeAll, ignoring %o', { size })

          return
        }

        // if there are unread bytes in the buffer,
        // send up to bytesWritten back
        if (bytesRead < bytesWritten) {
          const chunkLength = bytesWritten - bytesRead
          const bytes = buffer.slice(bytesRead, bytesRead + chunkLength)
          const bytesLength = bytes.length

          debug('reading unread bytes from buffer %o', {
            readerId, bytesRead, bytesWritten, chunkLength, readChunkLength: bytesLength,
          })

          bytesRead += bytesLength

          // if we can still push more bytes into
          // the buffer then do it
          if (readable.push(bytes)) {
            return onRead(size)
          }
        }

        // if it's finished and there are no unread bytes, EOF
        if (finished) {
        // cleanup listeners that were added
          writeable.removeListener('chunk', onRead)
          writeable.removeListener('finish', onRead)

          debug('buffered stream EOF %o', { readerId })

          return readable.push(null)
        }

        // if we're not finished we may end up writing
        // more data - or we may end
        writeable.removeListener('chunk', onRead)
        writeable.once('chunk', onRead)

        // if the writeable stream buffer isn't finished
        // yet - then read() will not be called again,
        // so we restart reading when its finished
        writeable.removeListener('finish', onRead)
        writeable.once('finish', onRead)
      }

      const readable = new stream.Readable({
        read: onRead,
        // @ts-ignore
        autoDestroy: true,
      })

      this.readers.push(readable)

      return readable
    }
    unpipeAll () {
      buffer = null // aggressive GC
      _.invokeMap(this.readers, 'unpipe')
    }
    _buffer () {
      return buffer
    }
    _finished () {
      return finished
    }
  }

  const writeable = new StreamBuffer({
    write: onWrite,
    final: onFinal,
    // @ts-ignore
    autoDestroy: true,
  })

  return writeable
}

module.exports = {
  streamBuffer,
}
