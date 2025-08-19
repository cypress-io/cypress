'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.writeWithBackpressure = writeWithBackpressure

async function writeWithBackpressure (toStream, chunk) {
  return new Promise((resolve, reject) => {
    try {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
      const ret = toStream.write(buffer)

      if (ret) {
        resolve()
      } else {
        toStream.once('drain', () => {
          resolve()
        })
      }
    } catch (err) {
      reject(err)
    }
  })
}
