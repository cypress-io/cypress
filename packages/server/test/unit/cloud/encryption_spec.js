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
    }, publicKey)

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
    }, publicKey)

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
})
