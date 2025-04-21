import crypto from 'crypto'
import { TextEncoder, promisify } from 'util'
import { generalDecrypt, GeneralJWE } from 'jose'
import base64Url from 'base64url'
import type { CypressRequestOptions } from './api'
import { deflateRaw as deflateRawCb } from 'zlib'
import fs from 'fs'

const deflateRaw = promisify(deflateRawCb)

const CY_TEST = `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFyZ0pGb2FuMFROTUxWSUNvZWF2WQpJVWtqNWJaM2QxTlVJdVU4WjM1b2hzcUFGWHY1eGhRRzd5MWdkeTR1SVZOSFU0a1RmUERBZEk1MnRWcGE5UG1yCm5OSDhsZE5kMjRwemVFNm1CeE91MlVDQ1d3VEY5eS9BUGZqNjVkczJSSTMwR09oZm95Q1pyQndxRU1zdWJ1MTUKVVNqbFBUcEFoWlFZN2Y2bHA4TTZMYU55SUhLMzYyMDgvZFp6aWs4Q1NLWmwya0E0TUN4eWxhUElWNVVWZG0rRQpkdjJhdm1Hcy9vQzVUV1VRNzlVSmJyMDllem1oZWExcS81VnpvajRvODlKSkNnelFhcllvL1QrNVlreWJ0Z2hkCjN3NnNPSjBCQ2NrUUV5MGpXVWJWUnhSa084VGJsckxXbC9Rd0Ryd1EvRERQaEZaSGhIbCtCL3JRTldsYTFXdEoKclFJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t`
const CY_STAGING = `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFxZE1OazZYVkFhV3VlT0lXZ3V2aQpDTlhPRGVtMHRINmo0NnFTWUhJZFcyU1N5NHU0ZFpGd1VHQldlZjBEbDVmeGhZa1BFczBxUDJHUnlUZnY5YjNXCk9xWEJFQmFyNXMyYzJSMGd1RzdqNGtidTlZZklRQWpWejZndUtQMTIzd3VKSjFmcEU5T3pXWlZmUi9pQWl4b1gKTi82aEFhSHNMT1RlNXROdTVESzNOQnUxa3VJTTExcDZScEo5bGgvbWVFK3JObzRZVWUvZ2Jzam1mZmJiODRGeQpqWk1sQW9YSnYxU3lKK2phdTNMa3JkdzMybWYrczMyd2NLUnNpbmp1STgrZndDT2lEb2xnZW9NdEhta2tXVS8xCnJvUnVEcGd6d2FZemxLbUhRODNWQTlOTUhvNmMwVU40MzlBMnVtRFQ4ek94SjJjQUY0U0RiWTV3RnBnd3cvUVgKd1FJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t`
const CY_DEVELOPMENT = `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF3aEpiaG1pbHJsT012V3V4WHdWcAp2MWZBSUZWNGlrcS8vOGhNdFpCbVk1WDRaNjVwQ3pqZjJzYVNXSnJVWExMd1R4d3VpOGlFd3hCb2Jlelc0d1ZsCk9xYjlEWE5RbnFvd2hrcGZNUmlhTjM0ZEtYZHZLZi9RaFAvU2tJbVFCYi9EQzFISWdhYjRXZGpJOFlwZnhHQWoKdkJhbU1TcEErVGdDekVGaWRuR3p6OUk5SmY0bUVBTHdIT3NGaVh3NkpqMmlXeDZBT1JtR3FBL3FYWStPY25wdQo1dmxISEl3cllxU1hQZjU2OHRUV2dZOVNvK0ZmYVhlK2s0MnZGeDAyRjdGRXlCZmJxMnBNdjhJWWJnbDViaE0rClRjUFVEYnpBZ0FWNUhlRENKKzQ2RklLNW9JZHV5WjhXQUQxRGFJRTQyWHBGNjlhWjRkcE11YnR5VDBIbXBHeHIKM3dJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t`
const CY_PRODUCTION = `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUE5dm5nWG1mdU51dnpnckJ3bHRLdApOZVQwYy9WYlZCWTRkZlZIaVBiQXF1Z3l2dndSUWFseVJ4SjNUdDgxL28vMXhyTXIyUUNtbXRkOVllTXA5dmVzClVqd1BuQnZucEIrWGo0ZXVoR2VVY0Q4Unhxb0cxdmFFd294ajFsSWFIckwrUVBBVGVPNFJ0Q3EweFM4TlduaGoKK1NYYm13NjNjWGtYZGthYzdlQVJmdmt2QjVMU1VqR290eXhPZGpOZmp2SmtvTU1GYXlqUGpSMGpFQldBL3NPZApFOENUTFRKdkYzakF0ODVpSDBHYWNpQVhJUG1uUnJ2eEh0SS9seDNWNkk0T1dNeG45SDRRWStoMnFmV2N2bWlQCmsrL1FNMjQ5cW4zKzgvQnNRWHNEVXZOMWdwZk9nRUIxRTFRaWJMZVV1YVducE05YWRWZENzWEVvRS8xUHduZTIKMFFJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t`

const keys: Record<string, string> = {
  test: CY_TEST,
  development: CY_DEVELOPMENT,
  staging: CY_STAGING,
  production: CY_PRODUCTION,
}

const keyObjects: Record<string, crypto.KeyObject> = {}

function getPublicKey () {
  const env = process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'development'

  if (!keyObjects[env]) {
    keyObjects[env] = crypto.createPublicKey(Buffer.from(keys[env], 'base64').toString('utf8').trim())
  }

  return keyObjects[env]
}

export interface EncryptRequestData {
  jwe: GeneralJWE
  secretKey: crypto.KeyObject
}

export function verifySignature (body: string, signature: string, publicKey?: crypto.KeyObject) {
  const verify = crypto.createVerify('SHA256')

  verify.update(body)

  return verify.verify(publicKey || getPublicKey(), signature, 'base64')
}

export function verifySignatureFromFile (file: string, signature: string, publicKey?: crypto.KeyObject): Promise<boolean> {
  const verify = crypto.createVerify('SHA256')

  const stream = fs.createReadStream(file)

  stream.on('data', (chunk: crypto.BinaryLike) => {
    verify.update(chunk)
  })

  return new Promise<boolean>((resolve, reject) => {
    stream.on('end', () => {
      verify.end()
      resolve(verify.verify(publicKey || getPublicKey(), signature, 'base64'))
    })

    stream.on('error', reject)
  })
}

// Implements the https://www.rfc-editor.org/rfc/rfc7516 spec
// Functionally equivalent to the behavior for AES-256-GCM encryption
// in the jose library (https://github.com/panva/jose/blob/main/src/jwe/general/encrypt.ts),
// but allows us to keep track of the encrypting key locally, to optionally use it for decryption
// of encrypted payloads coming back in the response body.
export async function encryptRequest (params: CypressRequestOptions, publicKey?: crypto.KeyObject): Promise<EncryptRequestData> {
  const key = publicKey || getPublicKey()
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

  // Returns the payload in JWE format, as well as the secretKey so we can use it
  // for decrypting the payload sent in response
  return {
    secretKey,
    jwe: {
      iv: base64Url(iv),
      ciphertext: base64Url(encrypted),
      recipients: [
        {
          encrypted_key: base64Url(crypto.publicEncrypt(key, secretKey.export())),
        },
      ],
      tag: base64Url(cipher.getAuthTag()),
      protected: header,
    },
  }
}

/**
 * Given the returned JWE and the symmetric symmetric key used in the original request,
 * decrypts the response payload, which is assumed to be JSON
 */
export async function decryptResponse (jwe: GeneralJWE, encryptionKey: crypto.KeyObject): Promise<any> {
  const result = await generalDecrypt(jwe, encryptionKey)
  const plaintext = Buffer.from(result.plaintext).toString('utf8')

  return JSON.parse(plaintext)
}
