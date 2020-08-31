import { Http, HttpStages } from '../../../lib/http'
import { expect } from 'chai'
import sinon from 'sinon'

describe('http', function () {
  context('Http.handle', function () {
    let config
    let getRemoteState
    let middleware
    let incomingRequest
    let incomingResponse
    let error
    let httpOpts

    beforeEach(function () {
      config = {}
      getRemoteState = sinon.stub().returns({})

      incomingRequest = sinon.stub()
      incomingResponse = sinon.stub()
      error = sinon.stub()

      middleware = {
        [HttpStages.IncomingRequest]: [incomingRequest],
        [HttpStages.IncomingResponse]: [incomingResponse],
        [HttpStages.Error]: [error],
      }

      httpOpts = { config, getRemoteState, middleware }
    })

    it('calls IncomingRequest stack, then IncomingResponse stack', function () {
      incomingRequest.callsFake(function () {
        expect(incomingResponse).to.not.be.called
        expect(error).to.not.be.called

        this.incomingRes = {}

        this.end()
      })

      incomingResponse.callsFake(function () {
        expect(incomingRequest).to.be.calledOnce
        expect(error).to.not.be.called

        this.end()
      })

      return new Http(httpOpts)
      .handle({}, {})
      .then(function () {
        expect(incomingRequest, 'incomingRequest').to.be.calledOnce
        expect(incomingResponse, 'incomingResponse').to.be.calledOnce
        expect(error).to.not.be.called
      })
    })

    it('moves to Error stack if err in IncomingRequest', function () {
      incomingRequest.throws(new Error('oops'))

      error.callsFake(function () {
        expect(this.error.message).to.eq('oops')
        this.end()
      })

      return new Http(httpOpts)
      .handle({}, {})
      .then(function () {
        expect(incomingRequest).to.be.calledOnce
        expect(incomingResponse).to.not.be.called
        expect(error).to.be.calledOnce
      })
    })

    it('moves to Error stack if err in IncomingResponse', function () {
      incomingRequest.callsFake(function () {
        this.incomingRes = {}
        this.end()
      })

      incomingResponse.throws(new Error('oops'))

      error.callsFake(function () {
        expect(this.error.message).to.eq('oops')
        this.end()
      })

      return new Http(httpOpts)
      .handle({}, {})
      .then(function () {
        expect(incomingRequest).to.be.calledOnce
        expect(incomingResponse).to.be.calledOnce
        expect(error).to.be.calledOnce
      })
    })

    it('self can be modified by middleware and passed on', function () {
      const reqAdded = {}
      const resAdded = {}
      const errorAdded = {}

      let expectedKeys = ['req', 'res', 'config', 'getRemoteState', 'middleware']

      incomingRequest.callsFake(function () {
        expect(this).to.include.keys(expectedKeys)
        this.reqAdded = reqAdded
        expectedKeys.push('reqAdded')
        this.next()
      })

      const incomingRequest2 = sinon.stub().callsFake(function () {
        expect(this).to.include.keys(expectedKeys)
        expect(this.reqAdded).to.equal(reqAdded)
        this.incomingRes = {}
        expectedKeys.push('incomingRes')
        this.end()
      })

      incomingResponse.callsFake(function () {
        expect(this).to.include.keys(expectedKeys)
        this.resAdded = resAdded
        expectedKeys.push('resAdded')
        this.next()
      })

      const incomingResponse2 = sinon.stub().callsFake(function () {
        expect(this).to.include.keys(expectedKeys)
        expect(this.resAdded).to.equal(resAdded)
        expectedKeys.push('error')
        throw new Error('goto error stack')
      })

      error.callsFake(function () {
        expect(this.error.message).to.eq('goto error stack')
        expect(this).to.include.keys(expectedKeys)
        this.errorAdded = errorAdded
        this.next()
      })

      const error2 = sinon.stub().callsFake(function () {
        expect(this).to.include.keys(expectedKeys)
        expect(this.errorAdded).to.equal(errorAdded)
        this.end()
      })

      middleware[HttpStages.IncomingRequest].push(incomingRequest2)
      middleware[HttpStages.IncomingResponse].push(incomingResponse2)
      middleware[HttpStages.Error].push(error2)

      return new Http(httpOpts)
      .handle({}, {})
      .then(function () {
        [
          incomingRequest, incomingRequest2,
          incomingResponse, incomingResponse2,
          error, error2,
        ].forEach(function (fn) {
          expect(fn).to.be.calledOnce
        })
      })
    })
  })
})
