const _ = require('lodash')
const debug = require('debug')('cypress:server:stream_buffer')
const stream = require('stream')

function streamBuffer (initialSize = 2048) {
  let buffer = Buffer.allocUnsafe(initialSize)
  let bytesWritten = 0
  let finished = false

  const onWrite = (chunk, enc, cb) => {
    if (chunk.length + bytesWritten > buffer.length) {
      let newBufferLength = buffer.length

      while (newBufferLength < chunk.length + bytesWritten) {
        newBufferLength *= 2
      }

      debug('extending buffer to accomodate new chunk', {
        bufferLength: buffer.length,
        newBufferLength,
      })

      const newBuffer = Buffer.allocUnsafe(newBufferLength)

      buffer.copy(newBuffer)
      buffer = newBuffer
    }

    debug('appending chunk to buffer %o', { bytesWritten, chunkLength: chunk.length })

    bytesWritten += chunk.copy(buffer, bytesWritten)

    cb()
  }

  const onFinal = (cb) => {
    debug('_final called')
    finished = true
    cb()
  }

  const bufferer = new stream.Writable({
    write: onWrite,
    final: onFinal,
  })

  const readers = []

  bufferer.reader = () => {
    let bytesRead = 0
    const readerId = _.uniqueId('sbuf-reader')

    const readable = new stream.Readable({
      read (size = initialSize) {
        // if there are unread bytes in the buffer, send up to bytesWritten back
        if (bytesRead < bytesWritten) {
          const chunkLength = Math.min(size, bytesWritten - bytesRead)
          const bytes = buffer.slice(bytesRead, bytesRead + chunkLength)

          debug('reading unread bytes from buffer %o', { readerId, bytesRead, bytesWritten, readChunkLength: bytes.length, chunkLength, size })

          bytesRead += bytes.length

          // TODO: what happens if we don't push?
          return this.push(bytes)
        }

        // if there are no unread bytes, but the bufferer
        // is still writing in, send an empty string
        if (!finished) {
          debug('no unread bytes, sending empty string %o', { readerId, bytesRead, bytesWritten })

          return this.push('')
        }

        // if it's finished and there are no unread bytes, EOF
        debug('buffered stream EOF %o', { readerId })
        this.push(null)
      },
    })

    readers.push(readable)

    return readable
  }

  bufferer.unpipeAll = () => {
    _.invokeMap(readers, 'unpipe')
  }

  bufferer._buffer = () => {
    return buffer
  }

  bufferer._finished = () => {
    return finished
  }

  return bufferer
}

module.exports = {
  streamBuffer,
}
