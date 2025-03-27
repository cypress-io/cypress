import crypto from 'crypto'
import _ from 'lodash'
import Bluebird from 'bluebird'
import bodyParser from 'body-parser'
import Debug from 'debug'
import type { RequestHandler } from 'express'

import { getExample, assertSchema, RecordSchemaVersions } from './validations/cloudValidations'

import * as jose from 'jose'
import base64Url from 'base64url'

import systemTests from './system-tests'

let CAPTURE_PROTOCOL_ENABLED = false
let CAPTURE_PROTOCOL_MESSAGE: string | undefined
let CAPTURE_PROTOCOL_UPLOAD_ENABLED = true
let CAPTURE_PROTOCOL_INVALID_SIG = false

import {
  TEST_PRIVATE,
  PROTOCOL_STUB_VALID,
} from './protocol-stubs/protocolStubResponse'

const debug = Debug('cypress:system-tests:server-stub')

export const postRunResponseWithWarnings = getExample('createRun', 4, 'res')

export const postRunInstanceResponse = getExample('createInstance', 5, 'res')

export const postInstanceTestsResponse = getExample('postInstanceTests', 1, 'res')

postInstanceTestsResponse.actions = []
export const postRunResponse = _.assign({}, postRunResponseWithWarnings, { warnings: [] })

// mocked here rather than attempting to intercept and mock an s3 req
export const CAPTURE_PROTOCOL_UPLOAD_URL = '/capture-protocol/upload/?x-amz-credential=1234abcd&x-amz-signature=1a2b3c-4d5e6f'

let protocolStub: {
  value: string
  compressed: Buffer
  hash: string
  sign: string
} | undefined = undefined

export const postRunResponseWithProtocolEnabled = () => {
  debug('protocol enabled post run response with hash: ', protocolStub?.hash)

  return {
    ...postRunResponse,
    captureProtocolUrl: protocolStub?.hash ? `http://localhost:1234/capture-protocol/script/${protocolStub?.hash}.js` : '',
    capture: {
      url: protocolStub?.hash ? `http://localhost:1234/capture-protocol/script/${protocolStub?.hash}.js` : '',
    },
  }
}

export const postRunResponseWithProtocolDisabled = (response = postRunResponse) => {
  debug('protocol disabled post run response with message')
  const disabledMessage = CAPTURE_PROTOCOL_MESSAGE || postRunResponse.capture?.disabledMessage

  return {
    ...response,
    captureProtocolUrl: '',

    capture: {
      url: '',
      disabledMessage,
    },
  }
}

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
const sendUploadUrls = function (req, res) {
  const { body } = req

  let num = 0

  const json = {} as any

  if (body.video) {
    json.videoUploadUrl = 'http://localhost:1234/videos/video.mp4'
  }

  const screenshotUploadUrls = _.map(body.screenshots, (s) => {
    num += 1

    return {
      screenshotId: s.screenshotId,
      uploadUrl: `http://localhost:1234/screenshots/${num}.png`,
    }
  })

  json.screenshotUploadUrls = screenshotUploadUrls

  if (CAPTURE_PROTOCOL_ENABLED) {
    if (CAPTURE_PROTOCOL_UPLOAD_ENABLED) {
      json.captureUploadUrl = `http://localhost:1234${CAPTURE_PROTOCOL_UPLOAD_URL}`
    } else {
      json.captureUploadUrl = `http://fake.test/url`
    }
  }

  return res.json(json)
}
const mockServerState = {
  requests: [],
  setSpecs (req) {
    mockServerState.specs = [...req.body.specs]
    mockServerState.allSpecs = [...req.body.specs]
  },
  allSpecs: [],
  specs: [],
}

export const encryptBody = async (req, res, body) => {
  const enc = new jose.GeneralEncrypt(Buffer.from(JSON.stringify(body)))

  enc
  .setProtectedHeader({ alg: 'A256GCMKW', enc: 'A256GCM', zip: 'DEF' })
  .addRecipient(req.unwrappedSecretKey())

  res.header('x-cypress-encrypted', 'true')

  return await enc.encrypt()
}

type RouteHandler = {
  method: 'get' | 'post' | 'put' | 'delete'
  url: string
  reqSchema?: {
    [K in keyof RecordSchemaVersions]: [K, keyof RecordSchemaVersions[K]]
  }[keyof RecordSchemaVersions]
  resSchema?: {
    [K in keyof RecordSchemaVersions]: [K, keyof RecordSchemaVersions[K]]
  }[keyof RecordSchemaVersions]
  res?: RequestHandler | object
}

export const routeHandlers: Record<string, RouteHandler> = {
  sendPreflight: {
    method: 'post',
    url: '/preflight',
    res: async (req, res) => {
      const preflightResponse = { encrypt: true, apiUrl: req.body.apiUrl }

      return res.json(await encryptBody(req, res, preflightResponse))
    },
  },
  postRun: {
    method: 'post',
    url: '/runs',
    reqSchema: ['createRun', 4],
    resSchema: ['createRun', 4],
    res: (req, res) => {
      if (!req.body.specs) {
        throw new Error('expected for Test Runner to post specs')
      }

      mockServerState.setSpecs(req)

      const postRunResponseReturnVal = (CAPTURE_PROTOCOL_ENABLED && req.body.runnerCapabilities.protocolMountVersion === 2) ?
        (postRunResponseWithProtocolEnabled()) :
        (postRunResponseWithProtocolDisabled())

      return res.json(postRunResponseReturnVal)
    },
  },
  postRunInstance: {
    method: 'post',
    url: '/runs/:id/instances',
    reqSchema: ['createInstance', 5],
    resSchema: ['createInstance', 5],
    res: (req, res) => {
      const response = {
        ...postRunInstanceResponse,
        spec: mockServerState.specs.shift() || null,
        claimedInstances: mockServerState.allSpecs.length - mockServerState.specs.length,
        totalInstances: mockServerState.allSpecs.length,
      }

      return res.json(response)
    },
  },
  postInstanceTests: {
    method: 'post',
    url: '/instances/:id/tests',
    reqSchema: ['postInstanceTests', 1],
    resSchema: ['postInstanceTests', 1],
    res: postInstanceTestsResponse,
  },
  postInstanceResults: {
    method: 'post',
    url: '/instances/:id/results',
    reqSchema: ['postInstanceResults', 1],
    resSchema: ['postInstanceResults', 1],
    res: sendUploadUrls,
  },
  putArtifacts: {
    method: 'put',
    url: '/instances/:id/artifacts',
    // reqSchema: TODO(protocol): export this as part of manifest from cloud
    res: async (req, res) => {
      return res.sendStatus(200)
    },
  },
  putInstanceStdout: {
    method: 'put',
    url: '/instances/:id/stdout',
    reqSchema: ['updateInstanceStdout', 1],
    res (req, res) {
      return res.sendStatus(200)
    },
  },
  putVideo: {
    method: 'put',
    url: '/videos/:name',
    res (req, res) {
      return res.sendStatus(200)
    },
  },
  putScreenshots: {
    method: 'put',
    url: '/screenshots/:name',
    res (req, res) {
      return Bluebird.delay(300)
      .then(() => {
        return res.sendStatus(200)
      })
    },
  },
  getCaptureScript: {
    method: 'get',
    url: '/capture-protocol/script/*',
    res: async (req, res) => {
      if (protocolStub) {
        res.header('Content-Encoding', 'gzip')
        res.header('x-cypress-signature', CAPTURE_PROTOCOL_INVALID_SIG ? 'some-invalid-sig' : protocolStub.sign)
        res.status(200).send(protocolStub.compressed)
      } else {
        res.status(404).send('')
      }
    },
  },
  putCaptureScript: {
    method: 'put',
    url: '/capture-protocol/script/*',
    res: async (_, res) => {
      res.status(413).send('')
    },
  },
  putCaptureProtocolUpload: {
    method: 'put',
    url: '/capture-protocol/upload',
    res: (req, res) => {
      return res.status(200).json({
        ok: true,
      })
    },
  },
  postCaptureProtocolErrors: {
    method: 'post',
    url: '/capture-protocol/errors',
    res: (req, res) => {
      return res.status(200).send('')
    },
  },
}

export const createRoutes = (props: DeepPartial<typeof routeHandlers> = {}) => {
  return _.values(_.merge(_.cloneDeep(routeHandlers), props))
}

beforeEach(() => {
  mockServerState.requests.length = 0
  mockServerState.specs.length = 0
  mockServerState.allSpecs.length = 0
})

export const getRequestUrls = () => {
  return _.map(mockServerState.requests, 'url').filter((u) => u !== 'POST /preflight')
}

export const getRequests = () => {
  return mockServerState.requests.filter((r) => r.url !== 'POST /preflight')
}

const getResponse = function (responseSchema) {
  if (!responseSchema) {
    throw new Error('No response schema supplied')
  }

  if (_.isObject(responseSchema)) {
    return responseSchema
  }

  const [name, version] = responseSchema

  // @ts-expect-error
  return getExample(name, version, 'res')
}

const sendResponse = function (req, res, responseBody) {
  return new Promise<void>((resolve) => {
    const _writeRaw = res._writeRaw

    res._writeRaw = function () {
      resolve()

      return _writeRaw.apply(this, arguments)
    }

    if (_.isFunction(responseBody)) {
      return responseBody(req, res)
    }

    res.json(getResponse(responseBody))
    resolve()
  })
}

const ensureSchema = function (onRequestBody, expectedRequestSchema, responseBody, expectedResponseSchema) {
  let reqName; let reqVersion

  if (expectedRequestSchema) {
    [reqName, reqVersion] = expectedRequestSchema
  }

  return async function (req, res) {
    const { body } = req

    if (_.isFunction(onRequestBody)) {
      onRequestBody(body)
    }

    try {
      if (expectedRequestSchema) {
        // @ts-expect-error
        assertSchema(reqName, reqVersion, 'req')(body)
      }

      res.expectedResponseSchema = expectedResponseSchema

      await sendResponse(req, res, responseBody)

      const key = [req.method, req.url].join(' ')

      mockServerState.requests.push({
        url: key,
        body,
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('Schema Error:', err.message)
      debug(err)

      return res.status(412).json(err)
    }
  }
}

const assertResponseBodySchema = function (req, res, next) {
  const oldWrite = res.write
  const oldEnd = res.end

  const chunks = []

  res.write = (chunk) => {
    // buffer the response, we'll really write it on end
    return chunks.push(chunk)
  }

  res.end = function (chunk) {
    if (chunk) {
      chunks.push(chunk)
    }

    res.write = oldWrite
    res.end = oldEnd

    if (res.expectedResponseSchema && _.inRange(res.statusCode, 200, 299)) {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))

      const [resName, resVersion] = res.expectedResponseSchema

      try {
        assertSchema(resName, resVersion, 'res')(body)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Schema Error:', err.message)

        return res.status(412).json(err)
      }
    }

    chunks.map((chunk) => {
      return res.write(chunk)
    })

    return res.end()
  }

  return next()
}

const onServer = (routes) => {
  return (function (app) {
    app.use(bodyParser.json())
    app.use((req, res, next) => {
      if (req.headers['x-cypress-encrypted']) {
        const jwe = req.body

        req.unwrappedSecretKey = () => {
          return crypto.createSecretKey(
            crypto.privateDecrypt(
              TEST_PRIVATE,
              Buffer.from(base64Url.toBase64(jwe.recipients[0].encrypted_key), 'base64'),
            ),
          )
        }

        return jose.generalDecrypt(jwe, TEST_PRIVATE).then(({ plaintext }) => Buffer.from(plaintext).toString('utf8')).then((body) => {
          req.body = JSON.parse(body)
          next()
        }).catch(next)
      }

      return next()
    })

    app.use(assertResponseBodySchema)

    return _.each(routes, (route) => {
      return app[route.method](route.url, ensureSchema(
        route.onReqBody,
        route.reqSchema,
        route.res,
        route.resSchema,
      ))
    })
  })
}

export const enableCaptureProtocol = (stub = PROTOCOL_STUB_VALID) => {
  beforeEach(() => {
    protocolStub = stub
    CAPTURE_PROTOCOL_ENABLED = true
    CAPTURE_PROTOCOL_MESSAGE = undefined
  })

  afterEach(() => {
    protocolStub = undefined
    CAPTURE_PROTOCOL_ENABLED = false
    CAPTURE_PROTOCOL_MESSAGE = undefined
  })
}

export const disableCaptureProtocolWithMessage = (message: string) => {
  beforeEach(() => {
    CAPTURE_PROTOCOL_ENABLED = false
    CAPTURE_PROTOCOL_MESSAGE = message
  })

  afterEach(() => {
    CAPTURE_PROTOCOL_MESSAGE = undefined
  })
}

export const enableInvalidProtocolSignature = () => {
  beforeEach(() => {
    CAPTURE_PROTOCOL_INVALID_SIG = true
  })

  afterEach(() => {
    CAPTURE_PROTOCOL_INVALID_SIG = false
  })
}

export const disableCaptureProtocolUploadUrl = () => {
  beforeEach(() => {
    CAPTURE_PROTOCOL_UPLOAD_ENABLED = false
  })

  afterEach(() => {
    CAPTURE_PROTOCOL_ENABLED = true
  })
}

export const setupStubbedServer = (routes) => {
  systemTests.setup({
    servers: [{
      port: 1234,
      onServer: onServer(routes),
    }, {
      port: 3131,
      static: true,
    }],
  })

  return mockServerState
}
