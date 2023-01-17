require('../../spec_helper')
const encryption = require('../../../lib/cloud/encryption')

const TEST_BODY = {
  test: 'string',
  array: [
    {
      a: 1,
    },
    {
      a: 2,
    },
    {
      a: 3,
    },
  ],
}

describe('encryption', () => {
  describe('encryptRequest', () => {
    encryption.encryptRequest({
      encrypt: true,
      body: TEST_BODY,
    })

    //
  })
})

// const crypto = require('crypto')
// const { Readable } = require('stream')
// const stream = require('stream')
// const zlib = require('zlib')
// const secretKey = crypto.createSecretKey(crypto.randomBytes(16))

// ;(async () => {
//   const iv = crypto.randomBytes(16)
//   const cipher = crypto.createCipheriv('aes-128-gcm', secretKey, iv)
//   const hexKey = secretKey.export().toString('hex')

//   Readable.from(JSON.stringify({
//     timothy: 1,
//     again: [
//       {
//         c: 2,
//       },
//       {
//         timothy: 2,
//       },
//       {
//         timothy: 2,
//       },
//     ],
//   }))
//   .pipe(zlib.createGzip())
//   // .pipe(zlib.createGunzip())
//   .pipe(cipher)
//   .pipe(new stream.Transform({
//     transform (chunk, encoding, callback) {
//       if (!this.__init) {
//         this.__init = true
//         this.push(Buffer.concat([iv, chunk]))
//       } else {
//         this.push(chunk)
//       }

//       callback()
//     },
//     final (cb) {
//       this.push(cipher.getAuthTag())
//       cb()
//     },
//   }))
//   // .pipe(new stream.PassThrough({
//   //   transform (chunk, enc, cb) {
//   //     this.chunks ??= []
//   //     this.chunks.push(chunk)
//   //     cb()
//   //   },
//   //   final (cb) {
//   //     console.log(this.chunks)
//   //     cb()
//   //   },
//   // }))
//   .pipe(new stream.Transform({
//     transform (chunk, encoding, callback) {
//       chunk = Buffer.from(chunk)
//       if (!this.__crypto) {
//         this.__crypto = crypto.createDecipheriv('aes-128-gcm', Buffer.from(hexKey, 'hex'), chunk.slice(0, 16))
//         this.__input = chunk.slice(16)
//       } else {
//         this.__input = Buffer.concat([this.__input, chunk])
//       }

//       callback()
//     },
//     final (cb) {
//       const input = this.__input
//       const tag = input.slice(input.length - 16, input.length)
//       const toDecrypt = input.slice(0, input.length - tag.length)

//       this.__crypto.setAuthTag(tag)
//       this.push(Buffer.concat([this.__crypto.update(toDecrypt), this.__crypto.final()]))
//       cb()
//     },
//   }))
//   .pipe(zlib.createUnzip())
//   .pipe(process.stdout)
// })()
