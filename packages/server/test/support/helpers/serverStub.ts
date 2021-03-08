import _ from 'lodash'
import Bluebird from 'bluebird'
import bodyParser from 'body-parser'
import { api as jsonSchemas } from '@cypress/json-schemas'
import e2e from './e2e'

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
  postRun: {
    method: 'post',
    url: '/runs',
    req: 'postRunRequest@2.3.0',
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
    req: 'postRunInstanceRequest@2.1.0',
    resSchema: 'postRunInstanceResponse@2.1.0',
    res: (req, res) => {
      console.log(mockServerState.allSpecs.length, mockServerState.specs.length)
      const response = {
        ...postRunInstanceResponse,
        spec: mockServerState.specs.shift() || null,
        claimedInstances: mockServerState.allSpecs.length - mockServerState.specs.length,
        totalInstances: mockServerState.allSpecs.length,
      }

      console.log('response', response)

      return res.json(response)
    },
  },
  postInstanceTests: {
    method: 'post',
    url: '/instances/:id/tests',
    req: 'postInstanceTestsRequest@1.0.0',
    resSchema: 'postInstanceTestsResponse@1.0.0',
    res: postInstanceTestsResponse,
  },
  postInstanceResults: {
    method: 'post',
    url: '/instances/:id/results',
    req: 'postInstanceResultsRequest@1.0.0',
    resSchema: 'postInstanceResultsResponse@1.0.0',
    res: sendUploadUrls,
  },
  putInstanceStdout: {
    method: 'put',
    url: '/instances/:id/stdout',
    req: 'putInstanceStdoutRequest@1.0.0',
    res (req, res) {
      return res.sendStatus(200)
    },
  },
  putVideo: {
    method: 'put',
    url: '/videos/:name',
    res (req, res) {
      return Bluebird.delay(200)
      .then(() => {
        return res.sendStatus(200)
      })
    },
  },
  putScreenshots: {
    method: 'put',
    url: '/screenshots/:name',
    res (req, res) {
      return res.sendStatus(200)
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
  return new Promise((resolve) => {
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

const ensureSchema = function (expectedRequestSchema, responseBody, expectedResponseSchema) {
  let reqName; let reqVersion

  if (expectedRequestSchema) {
    [reqName, reqVersion] = expectedRequestSchema.split('@')
  }

  return async function (req, res) {
    const { body } = req

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

    app.use(assertResponseBodySchema)

    return _.each(routes, (route) => {
      return app[route.method](route.url, ensureSchema(
        route.req,
        route.res,
        route.resSchema,
      ))
    })
  })
}

export const setupStubbedServer = (routes, settings = {}) => {
  e2e.setup({
    settings: _.extend({
      projectId: 'pid123',
      videoUploadOnPasses: false,
    }, settings),
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
