import crypto from 'crypto'
import _ from 'lodash'
import Bluebird from 'bluebird'
import bodyParser from 'body-parser'
import { api as jsonSchemas } from '@cypress/json-schemas'
import * as jose from 'jose'

import systemTests from './system-tests'

export const postRunResponseWithWarnings = jsonSchemas.getExample('postRunResponse')('2.2.0')

export const postRunInstanceResponse = jsonSchemas.getExample('postRunInstanceResponse')('2.1.0')

export const postInstanceTestsResponse = jsonSchemas.getExample('postInstanceTestsResponse')('1.0.0')

postInstanceTestsResponse.actions = []
export const postRunResponse = _.assign({}, postRunResponseWithWarnings, { warnings: [] })

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

const routeHandlers = {
  preflight: {
    method: 'post',
    url: '/runs/preflight',
    res: async (req, res) => {
      const preflightResponse = { encrypt: true, apiUrl: req.body.apiUrl }

      mockServerState.setSpecs(req)

      const enc = new jose.GeneralEncrypt(Buffer.from(JSON.stringify(preflightResponse)))

      enc
      .setProtectedHeader({ alg: 'A256GCMKW', enc: 'A256GCM', zip: 'DEF' })
      .addRecipient(req.unwrappedSecretKey)

      res.header('x-cypress-encrypted', 'true')

      return res.json(await enc.encrypt())
    },
  },
  postRun: {
    method: 'post',
    url: '/runs',
    reqSchema: 'postRunRequest@2.4.0',
    resSchema: 'postRunResponse@2.2.0',
    res: (req, res) => {
      if (!req.body.specs) {
        throw new Error('expected for Test Runner to post specs')
      }

      mockServerState.setSpecs(req)

      return res.json(postRunResponse)
    },
  },
  postRunInstance: {
    method: 'post',
    url: '/runs/:id/instances',
    reqSchema: 'postRunInstanceRequest@2.1.0',
    resSchema: 'postRunInstanceResponse@2.1.0',
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
    reqSchema: 'postInstanceTestsRequest@1.0.0',
    resSchema: 'postInstanceTestsResponse@1.0.0',
    res: postInstanceTestsResponse,
  },
  postInstanceResults: {
    method: 'post',
    url: '/instances/:id/results',
    reqSchema: 'postInstanceResultsRequest@1.1.0',
    resSchema: 'postInstanceResultsResponse@1.0.0',
    res: sendUploadUrls,
  },
  putInstanceStdout: {
    method: 'put',
    url: '/instances/:id/stdout',
    reqSchema: 'putInstanceStdoutRequest@1.0.0',
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

}

export const createRoutes = (props: DeepPartial<typeof routeHandlers>) => {
  return _.values(_.merge(_.cloneDeep(routeHandlers), props))
}

beforeEach(() => {
  mockServerState.requests.length = 0
  mockServerState.specs.length = 0
  mockServerState.allSpecs.length = 0
})

export const getRequestUrls = () => {
  return _.map(mockServerState.requests, 'url')
}

export const getRequests = () => {
  return mockServerState.requests
}

const getSchemaErr = (tag, err, schema) => {
  return {
    errors: err.errors,
    object: err.object,
    example: err.example,
    message: `${tag} should follow ${schema} schema`,
  }
}

const getResponse = function (responseSchema) {
  if (!responseSchema) {
    throw new Error('No response schema supplied')
  }

  if (_.isObject(responseSchema)) {
    return responseSchema
  }

  const [name, version] = responseSchema.split('@')

  return jsonSchemas.getExample(name)(version)
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
    [reqName, reqVersion] = expectedRequestSchema.split('@')
  }

  return async function (req, res) {
    const { body } = req

    if (_.isFunction(onRequestBody)) {
      onRequestBody(body)
    }

    try {
      if (expectedRequestSchema) {
        jsonSchemas.assertSchema(reqName, reqVersion)(body)
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

      return res.status(412).json(getSchemaErr('request', err, expectedRequestSchema))
    }
  }
}

const SYSTEM_TESTS_PK = 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRRE9hSmVkRVhIMlQ3SVAKbzU0Z1g0RHdNVk01aTZVVDRaRUs2VUVIWkR5TVhVSVNlWG5MU25aazlYeDh0alcxSFMrNUp0T1NCMmtubGRwOApLamtkbllaWVNFS1JydWlyN0szeHU1dFBhYjFOUFN6Y3V0aFh1ZUpvVURaRVVmMGVwUDJ2UDY0TzVEOHpGb3BaCi9PTjNpZGo3YjUyY21hdFJlamdCMzQ2Rk5la2hobDFYQ2hObGJzYzRRbEJsczNubFAxMDc2aWh2TDFQRUlubzIKSlpRNzVKMndCWHp3dTA5TkFKdG5YSWdSNmJMaHgxWTRxYlFkL0VFTXRGd3ZmbUhPVnNxQnFqc3dWQUF2L1FyZQpDVnlzMFc5aVFyTG13Z2VoUkFiaTFsUWxuSzlReVNCbnRpeTh1MGF5YjRFd1o5NDV0T1pNbElicEtZb2lLNGNDCjBnV3NKcUVOQWdNQkFBRUNnZ0VCQUo4YVprdlBSNjRhYm1HNXVFaXg5VHl3ZUx0eDFmUkdPanhUNGlsbGJYcXcKNUI1RGZzdGlBWEwrKzA5U1VJSGtGb1k4MUhiS3VaYW0zenc0ZThCRlRXbzlnUHEwL1dxUXpOLzV3ZFRyNTl4aQozSExrbjZDM2l6cm5JWDEyU1l0V21LbCtoNWU0L3JKTm5LV1MxbSt0VlJFelR5V0lHbE42eHpOQ2RLUmdFdTBnCk4ycUJld1YzU21vMTVTbkk5alZvTmJvdzJtaTcxekF0UEo3SktqUHljUld4ZUJ0dXJDbXNGZ3lvc2lIOTRLMVgKaG1scEExcGYvZjJZcGx1VmtUYTRESjlUdzBEWVY0RlVVUVloY1JEbjNSSno2UDM4MUxPV1RONnRxaVRRemtoSApwc1JhdTF1d1E0UE5aKzd6M3RYSVJoU1hnRUptZ1hJNy9zSDFtYm51b3FFQ2dZRUE4cUo5UWlCUGVIOXNxZmNSCnVINlBFbmR1S1JISW4rYVpDeGh2UExld200VUE0ZTBTbGsvM3NEdm8xOCtxckgzclIraFJCWFBDZ0FhTDFySlMKSFlFb2h4V2txcjNmMVVuc0VWcWVoVTBoM01hOGZhMlRWNVY4N05HZ1oyTlV5eXgxYVFKYW1nUHNIMUh3eWlITgplY1ZhMVNaVm5YaFE3WUk3V1cwMDR5d3lYeVVDZ1lFQTJjZENtdGJVVm9paFJrcVBYc2lqWDhLejQ5N0JhSEcyCkd5RnUxOWU3OWorVVdxYTBodkJsSFdxUjlxSldobTFOK01XVlRWaENybWNYMnJXcGJyaU9pVElqUExlVDhkbHMKYllpbnBzbjJ3ekJpbHk0OHZKVEZLek50OEJ4NVovMkZDTGMzbXRGYnl6NFhhSVhKKzdxdDc3MUlXOC9lc3VOWApFaGZKM08zWktja0NnWUI4WDZLSmxQcG5zQm5KZmlhTlJnS2MycStUU2RSbmN0TWNodWZ1WGRLZnhhdlFJN0FWCmNPUnNhQ2xSQnRoY0Z5ZlY4bFlsejFMeVFXakpJeHRJbUg1bjBFWmFaMzRuWFA4dlhoNUlBbVBMUWV3NUdCS2gKSUxXcXgwSEwvWFRudU9CdWRaQnZ4bmJ4RHhXNDUxN21mcTJ5K1RXRnhMam5Kb3k1cUdzbHorLzZLUUtCZ0MwcwpNZHFnV1NjaDdDSUNjVDY5NjNWL2s0VGV2Y3VHV3JuQjg1WDkvOVVTVnhsK25zK21xYkt5V2xpSVQ5NU9hZkFDCk8vZnhLTk80T3JCNUlnMy9aa0Y3RHVnWFJDN1VaTE5MdDByWGRjSURGVkE2blFxWTZWVU9zKzBzV3RxQk1ja2YKQi8rckVabFU1ZEllZmtraTdkVmVzOVduaHBBZ3EvenF4a3AzWTZaUkFvR0Fmd042elJEL0xUaG1yOHpqNHdHVwp6TG16NHdBTEF6ZElvWXpaYjlGd3RyTFkxbDhmVldFYzJkMnlmN1BscStua0Q2dUJXd0gzblhudzBmaVVHM0lzCmoxWVhQZm9BcHJGRFIxd3B5WjB6OU5Pb3lzK1pRZndBUUM2MXhwZXY5dFljUEpUZGFKTzZPWi9oNExTMFR6ZFYKRm5qVk1YanJRRmpIQ0JrVkRJREFvSlE9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0='
const TEST_KEY = crypto.createPrivateKey(Buffer.from(SYSTEM_TESTS_PK, 'base64').toString('utf-8'))

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

      const [resName, resVersion] = res.expectedResponseSchema.split('@')

      try {
        jsonSchemas.assertSchema(resName, resVersion)(body)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Schema Error:', err.message)

        return res.status(412).json(getSchemaErr('response', err, res.expectedResponseSchema))
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
        req.unwrappedSecretKey = crypto.createSecretKey(
          crypto.privateDecrypt(
            TEST_KEY,
            Buffer.from(req.body.recipients[0].encrypted_key, 'base64'),
          ),
        )

        return jose.generalDecrypt(req.body, TEST_KEY).then(({ plaintext }) => Buffer.from(plaintext).toString('utf8')).then((body) => {
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
