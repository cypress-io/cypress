import crypto from 'crypto'
import { TextEncoder, promisify } from 'util'
import { generalDecrypt } from 'jose'
import type { CypressRequestOptions } from './api'
import { deflateRaw as deflateRawCb } from 'zlib'

const deflateRaw = promisify(deflateRawCb)

const DEV_KEY = `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF3aEpiaG1pbHJsT012V3V4WHdWcAp2MWZBSUZWNGlrcS8vOGhNdFpCbVk1WDRaNjVwQ3pqZjJzYVNXSnJVWExMd1R4d3VpOGlFd3hCb2Jlelc0d1ZsCk9xYjlEWE5RbnFvd2hrcGZNUmlhTjM0ZEtYZHZLZi9RaFAvU2tJbVFCYi9EQzFISWdhYjRXZGpJOFlwZnhHQWoKdkJhbU1TcEErVGdDekVGaWRuR3p6OUk5SmY0bUVBTHdIT3NGaVh3NkpqMmlXeDZBT1JtR3FBL3FYWStPY25wdQo1dmxISEl3cllxU1hQZjU2OHRUV2dZOVNvK0ZmYVhlK2s0MnZGeDAyRjdGRXlCZmJxMnBNdjhJWWJnbDViaE0rClRjUFVEYnpBZ0FWNUhlRENKKzQ2RklLNW9JZHV5WjhXQUQxRGFJRTQyWHBGNjlhWjRkcE11YnR5VDBIbXBHeHIKM3dJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t`
const TEST_KEY = `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFyZ0pGb2FuMFROTUxWSUNvZWF2WQpJVWtqNWJaM2QxTlVJdVU4WjM1b2hzcUFGWHY1eGhRRzd5MWdkeTR1SVZOSFU0a1RmUERBZEk1MnRWcGE5UG1yCm5OSDhsZE5kMjRwemVFNm1CeE91MlVDQ1d3VEY5eS9BUGZqNjVkczJSSTMwR09oZm95Q1pyQndxRU1zdWJ1MTUKVVNqbFBUcEFoWlFZN2Y2bHA4TTZMYU55SUhLMzYyMDgvZFp6aWs4Q1NLWmwya0E0TUN4eWxhUElWNVVWZG0rRQpkdjJhdm1Hcy9vQzVUV1VRNzlVSmJyMDllem1oZWExcS81VnpvajRvODlKSkNnelFhcllvL1QrNVlreWJ0Z2hkCjN3NnNPSjBCQ2NrUUV5MGpXVWJWUnhSa084VGJsckxXbC9Rd0Ryd1EvRERQaEZaSGhIbCtCL3JRTldsYTFXdEoKclFJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t`
const PROD_KEY = DEV_KEY // TODO: Replace with dedicated prod key

const ENV_KEY = process.env.CYPRESS_INTERNAL_ENV !== 'production' ? process.env.CYPRESS_INTERNAL_TEST_KEY === '1' ? TEST_KEY : DEV_KEY : PROD_KEY
const PUBLIC_KEY = crypto.createPublicKey(Buffer.from(ENV_KEY, 'base64').toString('utf8').trim())

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
// Functionally equivalent to the behavior for AES-256-GCM encryption
// in the jose library, but allows us to keep track of the encrypting key locally,
// to optionally use it for decryption of any payloads coming back in the response body.

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
