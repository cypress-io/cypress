import { expect } from 'chai'
import sinon from 'sinon'
import { Http, HttpStages } from '../../../lib/http'

describe('http', function () {
  context('Http.handle', function () {
    let config
    let middleware
    let incomingRequest
    let incomingResponse
    let error
    let httpOpts
    let on
    let off

    beforeEach(function () {
      config = {}
      incomingRequest = sinon.stub()
      incomingResponse = sinon.stub()
      error = sinon.stub()
      on = sinon.stub()
      off = sinon.stub()

      middleware = {
        [HttpStages.IncomingRequest]: [incomingRequest],
        [HttpStages.IncomingResponse]: [incomingResponse],
        [HttpStages.Error]: [error],
      }

      httpOpts = { config, middleware }
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
      // @ts-ignore
      .handleHttpRequest({}, { on, off })
      .then(function () {
        expect(incomingRequest, 'incomingRequest').to.be.calledOnce
        expect(incomingResponse, 'incomingResponse').to.be.calledOnce
        expect(error).to.not.be.called
        expect(on).to.be.calledOnce
        expect(off).to.be.calledTwice
      })
    })

    it('moves to Error stack if err in IncomingRequest', function () {
      incomingRequest.throws(new Error('oops'))

      error.callsFake(function () {
        expect(this.error.message).to.eq('Internal error while proxying "GET url" in 0:\noops')
        this.end()
      })

      return new Http(httpOpts)
      // @ts-ignore
      .handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      .then(function () {
        expect(incomingRequest).to.be.calledOnce
        expect(incomingResponse).to.not.be.called
        expect(error).to.be.calledOnce
        expect(on).to.not.be.called
        expect(off).to.be.calledThrice
      })
    })

    it('moves to Error stack if err in IncomingResponse', function () {
      incomingRequest.callsFake(function () {
        this.incomingRes = {}
        this.end()
      })

      incomingResponse.throws(new Error('oops'))

      error.callsFake(function () {
        expect(this.error.message).to.eq('Internal error while proxying "GET url" in 0:\noops')
        this.end()
      })

      return new Http(httpOpts)
      // @ts-ignore
      .handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      .then(function () {
        expect(incomingRequest).to.be.calledOnce
        expect(incomingResponse).to.be.calledOnce
        expect(error).to.be.calledOnce
        expect(on).to.be.calledOnce
        expect(off).to.have.callCount(4)
      })
    })

    it('self can be modified by middleware and passed on', function () {
      const reqAdded = {}
      const resAdded = {}
      const errorAdded = {}

      let expectedKeys = ['req', 'res', 'config', 'middleware']

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
        expect(this.error.message).to.eq('Internal error while proxying "GET url" in 1:\ngoto error stack')
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
      // @ts-ignore
      .handleHttpRequest({ method: 'GET', proxiedUrl: 'url' }, { on, off })
      .then(function () {
        [
          incomingRequest, incomingRequest2,
          incomingResponse, incomingResponse2,
          error, error2,
        ].forEach(function (fn) {
          expect(fn).to.be.calledOnce
        })

        expect(on).to.be.calledTwice
        expect(off).to.have.callCount(10)
      })
    })
  })
})
