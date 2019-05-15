const debug = require('debug')('cypress:server:stream_buffer')
const stream = require('stream')
const through2 = require('through2')

function streamBuffer (initialSize = 2048) {
  let buffer = Buffer.allocUnsafe(initialSize)
  let bytesWritten = 0
  let finished = false

  const onChunk = (chunk, enc, cb) => {
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

    return cb(null, chunk)
  }

  const onFlush = (cb) => {
    finished = true
    cb()
  }

  const bufferer = through2(onChunk, onFlush)
  const readers = []

  bufferer.reader = () => {
    let bytesRead = 0

    const readable = new stream.Readable({
      read (size = initialSize) {
        // if there are unread bytes in the buffer, send up to bytesWritten back
        if (bytesRead < bytesWritten) {
          const chunkLength = Math.min(size, bytesWritten)
          const bytes = buffer.slice(bytesRead, chunkLength)

          debug('reading unread bytes from buffer %o', { bytesRead, bytesWritten, readChunkLength: bytes.length, chunkLength, size })

          bytesRead += bytes.length

          return this.push(bytes)
        }

        // if there are no unread bytes, but the bufferer is still writing in, send an empty string
        if (!finished) {
          debug('no unread bytes, sending empty string %o', { bytesRead, bytesWritten })

          return this.push('')
        }

        // if it's finished and there are no unread bytes, EOF
        debug('buffered stream EOF')
        this.push(null)
      },
    })

    readers.push(readable)

    return readable
  }

  bufferer.unpipeAll = () => {
    readers.forEach((reader) => {
      reader.unpipe() // unpipes from all destinations
    })
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
