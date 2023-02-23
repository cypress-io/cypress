import crypto from 'crypto'
import _ from 'lodash'
import Bluebird from 'bluebird'
import bodyParser from 'body-parser'
import { api as jsonSchemas } from '@cypress/json-schemas'
import * as jose from 'jose'
import base64Url from 'base64url'

import systemTests from './system-tests'

const SYSTEM_TESTS_PRIVATE = 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQ3VBa1docWZSTTB3dFUKZ0toNXE5Z2hTU1BsdG5kM1UxUWk1VHhuZm1pR3lvQVZlL25HRkFidkxXQjNMaTRoVTBkVGlSTjg4TUIwam5hMQpXbHIwK2F1YzBmeVYwMTNiaW5ONFRxWUhFNjdaUUlKYkJNWDNMOEE5K1BybDJ6WkVqZlFZNkYraklKbXNIQ29RCnl5NXU3WGxSS09VOU9rQ0ZsQmp0L3FXbnd6b3RvM0lnY3JmcmJUejkxbk9LVHdKSXBtWGFRRGd3TEhLVm84aFgKbFJWMmI0UjIvWnErWWF6K2dMbE5aUkR2MVFsdXZUMTdPYUY1cldyL2xYT2lQaWp6MGtrS0ROQnF0aWo5UDdsaQpUSnUyQ0YzZkRxdzRuUUVKeVJBVExTTlpSdFZIRkdRN3hOdVdzdGFYOURBT3ZCRDhNTStFVmtlRWVYNEgrdEExCmFWclZhMG10QWdNQkFBRUNnZ0VBWW9OWXhwakFmWW54M1NwbHQxU0pyUGFLZ3krVlhSSHBEVVI0dVNNQXJHY1MKc3BjWXBvS0tGbmk3SjE0V3NibERKVkR5bm9aeWZzcDAvR0VtSTVFQ0RtdDNzNThSZ1F4V0tTTmxyWllBSkhENApHKzJNNGsrL1o1YUEvUWJwSjFDeWhETnlpWmtZUnk4K3hYa3lWWXpPWlJ0aEJSUG9tWGRwMGJ1Y0wybEFrN3NJCnVTUWIreTJtTUFXY1Q2UmRpYnFqcnNNMkE5YW1PQWc1bHd4L3NQUHRTbEdmVkZ6eExQYklDK3o3UmR1eWcyVEwKOXhnZkV5c0Y2dkpxSzJieW1pNGprd3dVZnhFRHluTmtIbEwzR1NsQlE1TkxnVjRVaXhrWEhKZ21OY041OERGTwpwT1NHQzAxMkNOVjQ4b3Fuc3VObEVjeVZhbTVSZk1iWXlCRm5PQVF5WlFLQmdRRGUxNmdISUk3Yk1VaXVLZHBwClV0YU8vMTNjMzlqQXFIcnllVnQ5UUhaTjU5aXdGZlN1N3kzZlYzVlFZRWJYZVpIU1ZkbC9uakhYTmRaaHdtbmUKWlcvZ3UzbHo4TlVjSElhaWZuT2RVSEh0czY2bjFlYUNvZDN0T29VYkhVUEhqYUl2L0F6ZlZTNWtBNzB6RTh6RApRNW5qS2JEc1hucExKY0QrV25VYzVIUlNjd0tCZ1FESDVueGZBaGkxckppQk1TeUpJYkZjUTl0dVVMT3JiQk9mCkZSeVArQzZybi9kZndvb09vL2lvaHJvT3FPSnVZTG9oTTltN1NvaHNpU3R2bG1VVEl3YlVTd1NNR00yMFdlK1cKR0ZjT01rQlk5NFVXdHF2aDlDaGMycmV6NkNDZE1VQkNHaVlMQ1V1SGp4ZDZqZ3ZZbG5vS2xsZzVBakJ2aUJDbApNM0VNZ2tOTFh3S0JnUUNwUVNGRmNJd3duZWszSjJEVjJHNVFwRk0xZk91VHdTUEk0VFlGRng0RUpCRm9CUFVZCm5WKzVJQ05oamc2Z2dKeXFKanlSZXFVZWNheklDYk1Ca1FmOXFFY2lNWXliMG1yTUpzRkhmaDlhVEx4ZWk4K04KN3NXeDlsMjg3MmhZdkJHdzRuOGdiZ0ZUUTZmRGtNbFlraExpLy9wNlBYUWplYVJ4VEdGaE5YL0lVd0tCZ0dKeQpyTVhOcm9XcW51RGhhdUdPYWw3YVBITXo0NGlGRFpUSFBPM2FlSUdsb3ByU29GTmRoZFRacFVBYkJJai9zaXN2CjhnYy9TYmpLUlU0TGIzUGhTRGU5U2x3RXl5b0xNT2RtelZqOGZweFNLb1ZwS1hWNlhYWjljUU4xU3JxZnl0bkQKTHdFNGJxNHdWb3ZROFJ5VjN6emZsa3RkUEtWeENXR1MyQllsQVNkWkFvR0FGRjliM2QvRko4Rm0rS25qNlhTaAozT3FuZlJ6NGRLN042bkxIUGdxelBGdVdiVWVPRGY1dTkrN3NpUVlNVkZyRWlZUlNvRStqc0FWREhBb1dIZ1Q3CmZlM2lUNzZuZVlHWVd3M1VwTjdQby9udTNiT3FWUzZSUEs0L05wZ0ZuM1ZzTUdyRTVKVVY5N0Z1Q1NKNHM4Wk8KTzJnWnBRdVpHQm40Und0LzEwOXdEYTQ9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0='
const TEST_PRIVATE = crypto.createPrivateKey(Buffer.from(SYSTEM_TESTS_PRIVATE, 'base64').toString('utf8'))

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

export const encryptBody = async (req, res, body) => {
  const enc = new jose.GeneralEncrypt(Buffer.from(JSON.stringify(body)))

  enc
  .setProtectedHeader({ alg: 'A256GCMKW', enc: 'A256GCM', zip: 'DEF' })
  .addRecipient(req.unwrappedSecretKey())

  res.header('x-cypress-encrypted', 'true')

  return await enc.encrypt()
}

export const routeHandlers = {
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
  return _.map(mockServerState.requests, 'url').filter((u) => u !== 'POST /preflight')
}

export const getRequests = () => {
  return mockServerState.requests.filter((r) => r.url !== 'POST /preflight')
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
