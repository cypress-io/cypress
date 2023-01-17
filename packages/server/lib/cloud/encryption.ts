import crypto from 'crypto'
import * as zlib from 'zlib'
import { Readable, Stream } from 'stream'
import type { CypressRequestOptions } from './api'

const DEV_KEY = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwhJbhmilrlOMvWuxXwVp
v1fAIFV4ikq//8hMtZBmY5X4Z65pCzjf2saSWJrUXLLwTxwui8iEwxBobezW4wVl
Oqb9DXNQnqowhkpfMRiaN34dKXdvKf/QhP/SkImQBb/DC1HIgab4WdjI8YpfxGAj
vBamMSpA+TgCzEFidnGzz9I9Jf4mEALwHOsFiXw6Jj2iWx6AORmGqA/qXY+Ocnpu
5vlHHIwrYqSXPf568tTWgY9So+FfaXe+k42vFx02F7FEyBfbq2pMv8IYbgl5bhM+
TcPUDbzAgAV5HeDCJ+46FIK5oIduyZ8WAD1DaIE42XpF69aZ4dpMubtyT0HmpGxr
3wIDAQAB
-----END PUBLIC KEY-----
`

const PROD_KEY = DEV_KEY // TODO: Replace with dedicated prod key
const ENV_KEY = process.env.CYPRESS_INTERNAL_ENV !== 'production' ? DEV_KEY : PROD_KEY
const PUBLIC_KEY = crypto.createPublicKey(ENV_KEY.trim())

export function encryptRequest (params: CypressRequestOptions) {
  const secretKey = crypto.createSecretKey(crypto.randomBytes(16))
  const headers = params.headers != null ? params.headers : (params.headers = {})

  // If we've signaled that the response is encrypted as well, we need to decrypt it,
  // using the
  params.transform = (body, response, resolveWithFullResponse) => {
    if (response.headers['x-cypress-response-encrypted']) {
      return decryptRequest(secretKey, body)
    }

    return typeof body === 'string' ? JSON.parse(body) : body
  }

  if (process.env.NODE_ENV === 'production') {
    const wrappedKey = crypto.publicEncrypt({ key: PUBLIC_KEY }, secretKey.export()).toString('hex')

    headers['x-cypress-encryption-key-wrapped'] = wrappedKey
  } else {
    headers['x-cypress-encryption'] = secretKey.export().toString('hex')
  }

  if (params.body) {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-128-gcm', secretKey, iv)

    const stream = Readable.from(JSON.stringify(params.body))
    .pipe(zlib.createGzip())
    .pipe(cipher)
    .pipe(completeCipher(cipher, iv))

    params.body = stream
    // JSON means that we stringify the body, since we have a stream,
    // we need to explicitly set this to false
    params.json = false
  }
}

function completeCipher (cipher: crypto.CipherGCM, iv: Buffer) {
  let init = false

  return new Stream.Transform({
    transform (chunk, encoding, callback) {
      if (!init) {
        init = true
        this.push(iv)
      }

      this.push(chunk)
      callback()
    },
    final (cb) {
      this.push(cipher.getAuthTag())
      cb()
    },
  })
}

function decryptRequest (secretKey: crypto.KeyObject, body: string) {
  // const bodyBuffer = Buffer.from(body)
  // const decipher = crypto.createDecipheriv('aes-128-gcm', secretKey, Buffer.from(iv, 'base64'))

  // Readable.from(body)
  // .pipe(decipher)

  // decipher.setAuthTag(Buffer.from(authTag, 'base64'))

  // const decryptedString = decipher.update(encrypted, 'base64', 'utf8')

  // decipher.final()

  // return JSON.parse(decryptedString)
}
