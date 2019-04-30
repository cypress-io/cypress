const debug = require('debug')('cypress:server:lazy-stream')
const fs = require('fs')
const stream = require('stream')
const through2 = require('through2')

function lazyStream (filename, highWaterMark = 4096) {
  let buffer = Buffer.alloc(highWaterMark)
  let bytesWritten = 0
  let writeStream
  let finished = false

  const onChunk = (chunk, enc, cb) => {
    if (!writeStream && bytesWritten + chunk.length <= highWaterMark) {
      // there's still space, just append it
      bytesWritten += chunk.copy(buffer, bytesWritten)

      return cb(null, chunk)
    }

    // chunk won't fit in buffer, begin writing to disk
    if (!writeStream) {
      writeStream = fs.createWriteStream(filename)
      writeStream.write(buffer.slice(0, bytesWritten))
    }

    writeStream.write(chunk)
  }

  const onFlush = (cb) => {
    finished = true
    cb()
  }

  let bufferer = through2(onChunk, onFlush)

  let reader = () => {
    let bytesRead = 0
    let readStream

    return new stream.Readable({
      read (size = highWaterMark) {
        // if there's a file on disk, we should be reading from that
        if (writeStream) {
          if (!readStream) {
            readStream = fs.createReadStream(filename, { start: bytesRead })
          }

          return this.push(readStream.read(size))
        }

        // if there are unread bytes in the buffer, send up to `size` back
        if (bytesRead < bytesWritten) {
          const bytes = buffer.slice(bytesRead, Math.min(size, bytesWritten))

          bytesRead += bytes.length

          return this.push(bytes)
        }

        // if there are no unread bytes, but we'll have some eventually, send an empty string
        if (!finished) {
          return this.push('')
        }

        // if it's finished and there are no unread bytes, EOF
        this.push(null)
      },
    })
  }

  return {
    bufferer,
    reader,
  }
}

module.exports = {
  lazyStream,
}
