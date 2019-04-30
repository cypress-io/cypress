const debug = require('debug')('cypress:server:stream_buffer')
const fs = require('fs')
const stream = require('stream')
const through2 = require('through2')

function streamBuffer (filename, highWaterMark = 4096) {
  let buffer = Buffer.alloc(highWaterMark)
  let bytesWritten = 0
  let writeStream
  let writeStreamReady = false
  let finished = false

  const onChunk = (chunk, enc, cb) => {
    if (!writeStream && bytesWritten + chunk.length <= highWaterMark) {
      debug('appending chunk to buffer %o', { bytesWritten, chunkLength: chunk.length })

      bytesWritten += chunk.copy(buffer, bytesWritten)

      return cb(null, chunk)
    }

    // chunk won't fit in buffer, begin writing to disk
    if (!writeStream) {
      debug('buffer too big, bufferin to disk %o', { filename })
      writeStream = fs.createWriteStream(filename)
      writeStream.write(buffer.slice(0, bytesWritten))
    }

    debug('writing chunk to disk %o', { chunkLength: chunk.length })
    writeStream.write(chunk, (err) => {
      debug('chunk written %o', { err })

      if (err) {
        return cb(err)
      }

      writeStreamReady = true

      cb(null, chunk)
    })
  }

  const onFlush = (cb) => {
    finished = true
    cb()
  }

  const bufferer = through2(onChunk, onFlush)

  const reader = () => {
    let bytesRead = 0
    let readStream

    const readable = new stream.Readable({
      read (size = highWaterMark) {
        // if there's a file on disk, we should be reading from that
        if (writeStreamReady) {
          if (!readStream) {
            debug('reading stream from file %o', { filename, start: bytesRead })
            readStream = fs.createReadStream(filename, { start: bytesRead })
          }

          const chunk = readStream.read(size)

          debug('reading chunk from file %o', { size, chunkLength: chunk.length })

          return this.push(chunk)
        }

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

    return readable
  }

  return {
    bufferer,
    reader,
  }
}

module.exports = {
  streamBuffer,
}
