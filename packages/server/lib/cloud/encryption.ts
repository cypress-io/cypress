import crypto from 'crypto'
import { TextEncoder, promisify } from 'util'
import { generalDecrypt } from 'jose'

import type { CypressRequestOptions } from './api'
import { deflateRaw as deflateRawCb } from 'zlib'

const deflateRaw = promisify(deflateRawCb)

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

// The below is functionally equivalent to the behavior for AES-256-GCM encryption
// in the jose library, without the added indirection of managing behavior on both the
// client & server. Decided to strip the code out for the encryption to make it clearer what's going on,
// and because we want to keep track of the encrypting key locally, to optionally use it
// for decryption of any payloads coming back in the response body.

export interface JWEShape {
  iv: string
  ciphertext: string
  recipients: Array<{encrypted_key: string}>
  tag: string
  protected: string
}

export interface EncryptRequestData {
  jwe: JWEShape
  secretKey: crypto.KeyObject
}

// Implements the https://www.rfc-editor.org/rfc/rfc7516 spec
export async function encryptRequest (params: CypressRequestOptions, publicKey: crypto.KeyObject = PUBLIC_KEY): Promise<EncryptRequestData> {
  const header = base64Url(JSON.stringify({ alg: 'RSA-OAEP', enc: 'A256GCM', zip: 'DEF' }))
  const deflated = await deflateRaw(JSON.stringify(params.body))
  const iv = crypto.randomBytes(12)
  const secretKey = crypto.createSecretKey(crypto.randomBytes(32))
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, iv, { authTagLength: 16 })
  const aad = new TextEncoder().encode(header)

  cipher.setAAD(aad, {
    plaintextLength: deflated.length,
  })

  const encrypted = cipher.update(deflated)

  cipher.final()

  return {
    secretKey,
    jwe: {
      iv: base64Url(iv),
      ciphertext: base64Url(encrypted),
      recipients: [
        {
          encrypted_key: base64Url(crypto.publicEncrypt(publicKey, secretKey.export())),
        },
      ],
      tag: base64Url(cipher.getAuthTag()),
      protected: header,
    },
  }
}

export async function decryptResponse (jwe: JWEShape, encryptionKey: crypto.KeyObject): Promise<any> {
  const result = await generalDecrypt(jwe, encryptionKey)
  const plaintext = Buffer.from(result.plaintext).toString('utf8')

  return JSON.parse(plaintext)
}

function base64Url (input: any): string {
  if (Buffer.isEncoding('base64url')) {
    // @ts-ignore
    return Buffer.from(input).toString('base64url')
  }

  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
