import { Writable } from 'stream'

export async function writeWithBackpressure<T> (toStream: Writable, chunk: T): Promise<void> {
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
