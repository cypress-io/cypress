require('../../spec_helper')
const jose = require('jose')
const crypto = require('crypto')
const encryption = require('../../../lib/cloud/encryption')
const { expect } = require('chai')

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

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
})

describe('encryption', () => {
  it('encrypts payloads with encryptRequest', async () => {
    const { jwe, secretKey } = await encryption.encryptRequest({
      encrypt: true,
      body: TEST_BODY,
    }, { publicKey })

    const { plaintext } = await jose.generalDecrypt(jwe, privateKey)

    expect(JSON.parse(plaintext)).to.eql(TEST_BODY)

    const unwrappedKey = crypto.privateDecrypt(privateKey, Buffer.from(jwe.recipients[0].encrypted_key, 'base64'))

    expect(
      unwrappedKey.toString('base64'),
    ).to.eql(secretKey.export().toString('base64'))
  })

  it('is possible to use the secretKey to decrypt future responses', async () => {
    const { jwe, secretKey } = await encryption.encryptRequest({
      encrypt: true,
      body: TEST_BODY,
    }, { publicKey })

    const RESPONSE_BODY = { runId: 123 }

    const unwrappedKey = crypto.privateDecrypt(privateKey, Buffer.from(jwe.recipients[0].encrypted_key, 'base64'))
    const unwrappedSecretKey = crypto.createSecretKey(unwrappedKey)

    const enc = new jose.GeneralEncrypt(
      Buffer.from(JSON.stringify(RESPONSE_BODY)),
    )

    enc.setProtectedHeader({ alg: 'A256GCMKW', enc: 'A256GCM', zip: 'DEF' }).addRecipient(unwrappedSecretKey)

    const jweResponse = await enc.encrypt()
    const roundtripResponse = await encryption.decryptResponse(jweResponse, secretKey)

    expect(roundtripResponse).to.eql(RESPONSE_BODY)
  })

  // Regression: jose's default inflateRaw caps decompressed payloads at ~250KB,
  // which caused large cy.prompt /plan responses to fail with
  // "DecryptionError: decryption operation failed". decryptResponse must pass
  // DecryptOptions with a higher maxOutputLength to match the server-side limit.
  it('decrypts response payloads larger than the jose default inflate limit', async () => {
    const { jwe, secretKey } = await encryption.encryptRequest({
      encrypt: true,
      body: TEST_BODY,
    }, { publicKey })

    const unwrappedKey = crypto.privateDecrypt(privateKey, Buffer.from(jwe.recipients[0].encrypted_key, 'base64'))
    const unwrappedSecretKey = crypto.createSecretKey(unwrappedKey)

    // Build a payload whose uncompressed JSON is larger than jose's ~250KB
    // default but still well within our 5MB ceiling. Use random bytes per entry
    // so the DEFLATE layer can't trivially compress it away.
    const LARGE_RESPONSE = {
      items: Array.from({ length: 800 }, (_, i) => {
        return {
          id: i,
          xpath: `//body/div[${i}]`,
          innerText: crypto.randomBytes(256).toString('hex'),
        }
      }),
    }

    expect(JSON.stringify(LARGE_RESPONSE).length).to.be.greaterThan(400 * 1024)

    const enc = new jose.GeneralEncrypt(
      Buffer.from(JSON.stringify(LARGE_RESPONSE)),
    )

    enc.setProtectedHeader({ alg: 'A256GCMKW', enc: 'A256GCM', zip: 'DEF' }).addRecipient(unwrappedSecretKey)

    const jweResponse = await enc.encrypt()
    const roundtripResponse = await encryption.decryptResponse(jweResponse, secretKey)

    expect(roundtripResponse).to.eql(LARGE_RESPONSE)
  })
})
