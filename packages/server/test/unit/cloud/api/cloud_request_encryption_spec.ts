import express, { Request, Response } from 'express'
import crypto from 'crypto'
import { expect } from 'chai'
import fs from 'fs'

import { DestroyableProxy, fakeServer } from './utils/fake_proxy_server'
import bodyParser from 'body-parser'
import { TEST_PRIVATE } from '@tooling/system-tests/lib/protocol-stubs/protocolStubResponse'
import { createCloudRequest } from '../../../../lib/cloud/api/cloud_request'
import * as jose from 'jose'
import dedent from 'dedent'

declare global {
  namespace Express {
    interface Request {
      unwrappedSecretKey(): crypto.KeyObject
    }
  }
}

describe('CloudRequest Encryption', () => {
  let fakeEncryptionServer: DestroyableProxy
  const app = express()

  let requests: express.Request[] = []

  const encryptBody = async (req: express.Request, res: express.Response, body: object) => {
    const enc = new jose.GeneralEncrypt(Buffer.from(JSON.stringify(body)))

    enc
    .setProtectedHeader({ alg: 'A256GCMKW', enc: 'A256GCM', zip: 'DEF' })
    .addRecipient(req.unwrappedSecretKey())

    res.header('x-cypress-encrypted', 'true')

    return await enc.encrypt()
  }

  app.use(bodyParser.json())
  app.use((req, res, next) => {
    requests.push(req)
    if (req.headers['x-cypress-encrypted']) {
      const jwe = req.body

      req.unwrappedSecretKey = () => {
        return crypto.createSecretKey(
          crypto.privateDecrypt(
            TEST_PRIVATE,
            Buffer.from(jwe.recipients[0].encrypted_key, 'base64url'),
          ),
        )
      }

      return jose.generalDecrypt(jwe, TEST_PRIVATE).then(({ plaintext }) => Buffer.from(plaintext).toString('utf8')).then((body) => {
        req.body = JSON.parse(body)
        next()
      }).catch(next)
    }

    next()
  })

  function signResponse (req: Request, res: Response, val: Buffer | string) {
    if (req.headers['x-cypress-signature']) {
      const sign = crypto.createSign('sha256', {
        defaultEncoding: 'base64',
      })

      sign.update(val).end()
      const signature = sign.sign(TEST_PRIVATE, 'base64')

      res.setHeader('x-cypress-signature', signature)
    }

    res.write(val)
    res.end()
  }

  function invalidSignResponse (req: Request, res: Response, val: Buffer | string) {
    const hash = crypto.createHash('sha256', {
      defaultEncoding: 'base64',
    })

    hash.update(val).end()
    res.setHeader('x-cypress-signature', hash.digest('base64'))
    res.write(val)
    res.end()
  }

  app.get('/signed', async (req, res) => {
    const buffer = fs.readFileSync(__filename)

    return signResponse(req, res, buffer)
  })

  app.get('/invalid-signing', async (req, res) => {
    const buffer = fs.readFileSync(__filename)

    return invalidSignResponse(req, res, buffer)
  })

  app.post('/signed-post', async (req, res) => {
    return signResponse(req, res, JSON.stringify(req.body))
  })

  app.post('/invalid-signed-post', async (req, res) => {
    return invalidSignResponse(req, res, JSON.stringify(req.body))
  })

  app.post('/', async (req, res) => {
    return res.json(await encryptBody(req, res, req.body))
  })

  app.post('/error', async (req, res) => {
    return res.status(400).json(await encryptBody(req, res, {
      error: 'Some Error',
    }))
  })

  app.post('/error-signed', async (req, res) => {
    res.status(400)

    return signResponse(req, res, JSON.stringify(req.body))
  })

  app.post('/invalid-error-signed', async (req, res) => {
    res.status(400)

    return invalidSignResponse(req, res, JSON.stringify(req.body))
  })

  beforeEach(async () => {
    requests = []
    fakeEncryptionServer = await fakeServer({}, app)
  })

  afterEach(() => fakeEncryptionServer.teardown())

  describe('.get', () => {
    it('cannot issue .get requests with encryption', async () => {
      const EncryptReq = createCloudRequest({ baseURL: fakeEncryptionServer.baseUrl, enableEncryption: true })

      try {
        await EncryptReq.get('/foo')
        throw new Error('Unreachable')
      } catch (e) {
        expect(e.message).to.eq('Cannot issue GET requests with encryption')
      }
    })

    it('verifies the signed response', async () => {
      const SignedRes = createCloudRequest({ baseURL: fakeEncryptionServer.baseUrl, enableEncryption: 'signed' })

      // Good
      const data = await SignedRes.get('/signed').then((d) => d.data)

      expect(data).to.equal(fs.readFileSync(__filename, 'utf8'))

      // Bad
      try {
        await SignedRes.get('/invalid-signing')
        throw new Error('Unreachable')
      } catch (e) {
        expect(e.message).to.equal('Unable to verify the request signature for /invalid-signing')
      }
    })
  })

  describe('.post', () => {
    it('encrypts requests', async () => {
      const EncryptReq = createCloudRequest({ baseURL: fakeEncryptionServer.baseUrl, enableEncryption: 'always' })

      const dataObj = (v: number) => {
        return {
          foo: {
            bar: v,
          },
        }
      }

      const [res, res2, res3] = await Promise.all([
        EncryptReq.post('/', dataObj(1)),
        EncryptReq.post('/', dataObj(2)),
        EncryptReq.post('/', dataObj(3)),
      ])

      expect(res.data).to.eql(dataObj(1))
      expect(res2.data).to.eql(dataObj(2))
      expect(res3.data).to.eql(dataObj(3))
    })

    it('decrypts errors', async () => {
      const EncryptReq = createCloudRequest({ baseURL: fakeEncryptionServer.baseUrl, enableEncryption: 'always' })

      try {
        await EncryptReq.post('/error', {
          foo: true,
        })

        throw new Error('Unreachable')
      } catch (e) {
        expect(e.isApiError).to.be.true

        expect(e.message).to.equal(dedent`
        400

        {
          "error": "Some Error"
        }
        `)
      }
    })

    it('supports a signed response on encrypted requests', async () => {
      const SignedRes = createCloudRequest({ baseURL: fakeEncryptionServer.baseUrl, enableEncryption: true })

      // Good
      const data = await SignedRes.post('/signed-post', {
        foo: 'bar',
      }).then((d) => d.data)

      expect(data).to.equal(JSON.stringify({ foo: 'bar' }))

      // Bad
      try {
        await SignedRes.post('/invalid-signed-post', {})
        throw new Error('Unreachable')
      } catch (e) {
        expect(e.message).to.equal('Unable to verify the request signature for /invalid-signed-post')
      }
    })

    it('supports a signed response on encrypted error responses', async () => {
      const SignedRes = createCloudRequest({ baseURL: fakeEncryptionServer.baseUrl, enableEncryption: true })

      // Good
      try {
        await SignedRes.post('/error-signed', {
          foo: 'bar',
        })

        throw new Error('Unreachable')
      } catch (e) {
        expect(e.response.data).to.equal(JSON.stringify({ foo: 'bar' }))
      }

      // Bad
      try {
        await SignedRes.post('/invalid-error-signed', {})
        throw new Error('Unreachable')
      } catch (e) {
        expect(e.message).to.equal('Unable to verify the request signature for /invalid-error-signed')
      }
    })
  })
})
