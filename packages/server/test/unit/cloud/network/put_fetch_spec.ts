import sinon from 'sinon'
import { expect } from 'chai'
import { Response } from 'cross-fetch'
import proxyquire from 'proxyquire'
import type { putFetch } from '../../../../lib/cloud/network/put_fetch'
import { ParseError } from '../../../../lib/cloud/network/parse_error'
import { HttpError } from '../../../../lib/cloud/network/http_error'
import { SystemError } from '../../../../lib/cloud/network/system_error'

describe('cloud/network/put_fetch', () => {
  const url = 'https://some.test/url'
  const jsonText = '{ "content": "json" }'
  const jsonObj = JSON.parse(jsonText)
  const nonJsonText = 'some text response'
  const badJsonErr = 'Unexpected token < in JSON at position 0'
  let resolveVal
  let stubbedCrossFetch: sinon.SinonStub
  let fetch: typeof putFetch

  beforeEach(() => {
    stubbedCrossFetch = sinon.stub()
    const importPutFetch = proxyquire.noCallThru()('../../../../lib/cloud/network/put_fetch', {
      'cross-fetch': stubbedCrossFetch,
    })

    fetch = importPutFetch.putFetch
  })

  describe('when fetch resolves', () => {
    beforeEach(() => {
      resolveVal = new Response()
      sinon.stub(resolveVal, 'url').get(() => url)
      stubbedCrossFetch.resolves(resolveVal)
    })

    describe('when fetch resolves with a json-parseable response', () => {
      beforeEach(() => {
        sinon.stub(resolveVal, 'json').resolves(jsonObj)
        sinon.stub(resolveVal, 'text').resolves(jsonText)
      })

      describe('and parseJSON flag is true', () => {
        it('resolves with the parsed object', async () => {
          const res = await fetch<{'content': string}>(url)

          expect(res).to.eq(jsonObj)
        })
      })

      describe('and parseJSON flag is false', () => {
        it('resolves with the response text as a string', async () => {
          const res = await fetch(url, { parse: 'text' })

          expect(res).to.eq(jsonText)
        })
      })
    })

    describe('when fetch resolves with a non-json-parseable response', () => {
      beforeEach(() => {
        sinon.stub(resolveVal, 'json').rejects(new Error(badJsonErr))
        sinon.stub(resolveVal, 'text').resolves(nonJsonText)
      })

      describe('and default parse (json) is used', () => {
        it('throws a parse error', async () => {
          let err: any

          try {
            await fetch(url)
          } catch (e) {
            err = e
          }
          expect(err.message).to.eq(badJsonErr)
          expect(ParseError.isParseError(err)).to.be.true
        })
      })

      describe('and text parse is used', () => {
        it('resolves with the response text as a string', async () => {
          const res = await fetch(url, { parse: 'text' })

          expect(res).to.eq(nonJsonText)
        })
      })
    })

    describe('when fetch resolves with a response indicative of an http error', () => {
      beforeEach(() => {
        sinon.stub(resolveVal, 'status').get(() => 400)
        sinon.stub(resolveVal, 'statusText').get(() => 'Bad Request')
        sinon.stub(resolveVal, 'text').resolves(`<error><ref>4125</ref><kind>BadRequest</kind></error>`)
        sinon.stub(resolveVal, 'json').rejects(badJsonErr)
      })

      it('throws an HttpError', async () => {
        let err

        try {
          await fetch(url, { parse: 'text' })
        } catch (e) {
          err = e
        }
        expect(err).not.to.be.undefined
        expect(HttpError.isHttpError(err)).to.be.true
      })
    })
  })

  describe('when fetch rejects with a system error', () => {
    const networkErrMsg = 'Error: ECONNRESET'
    let err: Error & { code?: string } | undefined

    beforeEach(() => {
      err = new Error(networkErrMsg)

      err.code = 'ECONNRESET'
      stubbedCrossFetch.rejects(err)
    })

    it('throws a SystemError', async () => {
      let err

      try {
        await fetch(url, { parse: 'text' })
      } catch (e) {
        err = e
      }
      expect(SystemError.isSystemError(err)).to.be.true
    })
  })

  describe('when fetch is provided with an abort signal, and rejects via signal', () => {
    let abortError
    let fetchError
    let mockAbortController
    let mockSignal

    beforeEach(() => {
      abortError = new Error('connection stall')
      fetchError = new Error('User aborted the request')
      mockAbortController = sinon.createStubInstance(AbortController)
      mockSignal = sinon.createStubInstance(AbortSignal)
      sinon.stub(mockAbortController, 'signal').get(() => {
        return mockSignal
      })

      sinon.stub(mockSignal, 'aborted').get(() => {
        return true
      })

      sinon.stub(mockSignal, 'reason').get(() => {
        return abortError
      })

      stubbedCrossFetch.rejects(fetchError)
    })

    it('rethrows the signal reason', async () => {
      let error: Error | undefined

      try {
        await fetch(url, { parse: 'text', signal: mockSignal })
      } catch (e) {
        error = e
      }

      expect(error).to.eq(abortError)
    })
  })
})
