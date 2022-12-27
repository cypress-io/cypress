import _ from 'lodash'
import ErrorMiddleware, {
  AbortRequest,
  UnpipeResponse,
  DestroyResponse,
} from '../../../lib/http/error-middleware'
import { expect } from 'chai'
import sinon from 'sinon'
import {
  testMiddleware,
} from './helpers'

describe('http/error-middleware', function () {
  it('exports the members in the correct order', function () {
    expect(_.keys(ErrorMiddleware)).to.have.ordered.members([
      'LogError',
      'SendToDriver',
      'InterceptError',
      'AbortRequest',
      'UnpipeResponse',
      'DestroyResponse',
    ])
  })

  context('AbortRequest', function () {
    it('destroys outgoingReq if it exists', function () {
      const ctx = {
        outgoingReq: {
          abort: sinon.stub(),
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      return testMiddleware([AbortRequest], ctx)
      .then(() => {
        expect(ctx.outgoingReq.abort).to.be.calledOnce
      })
    })

    it('does not destroy outgoingReq if it does not exist', function () {
      return testMiddleware([AbortRequest], {
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      })
    })
  })

  context('UnpipeResponse', function () {
    it('unpipes incomingRes if it exists', function () {
      const ctx = {
        incomingResStream: {
          unpipe: sinon.stub(),
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      return testMiddleware([UnpipeResponse], ctx)
      .then(() => {
        expect(ctx.incomingResStream.unpipe).to.be.calledOnce
      })
    })

    it('does not unpipe incomingRes if it does not exist', function () {
      return testMiddleware([UnpipeResponse], {
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      })
    })
  })

  context('DestroyResponse', function () {
    it('destroys the response', function () {
      const ctx = {
        res: {
          destroy: sinon.stub(),
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      return testMiddleware([DestroyResponse], ctx)
      .then(() => {
        expect(ctx.res.destroy).to.be.calledOnce
      })
    })
  })
})
