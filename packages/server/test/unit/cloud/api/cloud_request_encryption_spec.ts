import express, { Request, Response } from 'express'
import crypto from 'crypto'
import { expect } from 'chai'
import fs from 'fs'

import { DestroyableProxy, fakeServer } from './utils/fake_proxy_server'
import bodyParser from 'body-parser'
import { TEST_PRIVATE } from '@tooling/system-tests/lib/protocol-stubs/protocolStubResponse'
import { createCloudRequest, TCloudReqest } from '../../../../lib/cloud/api/cloud_request'
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

  app.get('/ping', (req, res) => res.json({ pong: 'true' }))

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

  let TestReq: TCloudReqest

  before(async () => {
    fakeEncryptionServer = await fakeServer({}, app)
    TestReq = createCloudRequest({ baseURL: fakeEncryptionServer.baseUrl })
  })

  beforeEach(async () => {
    requests = []
  })

  after(() => fakeEncryptionServer.teardown())

  it('cannot issue encryption request without body', async () => {
    try {
      await TestReq.get('/foo', {
        encrypt: true,
      })

      throw new Error('Unreachable')
    } catch (e) {
      expect(e.message).to.eq('Cannot issue encrypted request to /foo without request body')
    }
  })

  it('verifies the signed response', async () => {
    // Good
    const data = await TestReq.get('/signed', { encrypt: 'signed' }).then((d) => d.data)

    expect(data).to.equal(fs.readFileSync(__filename, 'utf8'))

    // Bad
    try {
      await TestReq.get('/invalid-signing', { encrypt: 'signed' })
      throw new Error('Unreachable')
    } catch (e) {
      expect(e.message).to.equal('Unable to verify response signature for /invalid-signing')
    }
  })

  it('enforces a response signature on signed requests', async () => {
    try {
      await TestReq.get('/ping', { encrypt: 'signed' })
      throw new Error('Unreachable')
    } catch (e) {
      expect(e.message).to.equal('Expected signed response for /ping')
    }
  })

  it('encrypts requests', async () => {
    const dataObj = (v: number) => {
      return {
        foo: {
          bar: v,
        },
      }
    }

    const [res, res2, res3] = await Promise.all([
      TestReq.post('/', dataObj(1), { encrypt: 'always' }),
      TestReq.post('/', dataObj(2), { encrypt: 'always' }),
      TestReq.post('/', dataObj(3), { encrypt: 'always' }),
    ])

    expect(res.data).to.eql(dataObj(1))
    expect(res2.data).to.eql(dataObj(2))
    expect(res3.data).to.eql(dataObj(3))
  })

  it('decrypts errors', async () => {
    try {
      await TestReq.post('/error', {
        foo: true,
      }, { encrypt: 'always' })

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
    // Good
    const data = await TestReq.post('/signed-post', {
      foo: 'bar',
    }, { encrypt: 'signed' }).then((d) => d.data)

    expect(data).to.eql({ foo: 'bar' })

    // Bad
    try {
      await TestReq.post('/invalid-signed-post', {}, {
        encrypt: 'signed',
      })

      throw new Error('Unreachable')
    } catch (e) {
      expect(e.message).to.equal('Unable to verify response signature for /invalid-signed-post')
    }
  })
})
