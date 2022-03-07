import _ from 'lodash'
import RequestMiddleware from '../../../lib/http/request-middleware'
import { expect } from 'chai'
import { testMiddleware } from './helpers'
import { CypressIncomingRequest, CypressOutgoingResponse } from '../../../lib'
import { HttpBuffer, HttpBuffers } from '../../../lib/http/util/buffers'

describe('http/request-middleware', () => {
  it('exports the members in the correct order', () => {
    expect(_.keys(RequestMiddleware)).to.have.ordered.members([
      'LogRequest',
      'ExtractIsAUTFrameHeader',
      'MaybeEndRequestWithBufferedResponse',
      'CorrelateBrowserPreRequest',
      'SendToDriver',
      'InterceptRequest',
      'RedirectToClientRouteIfUnloaded',
      'EndRequestsToBlockedHosts',
      'StripUnsupportedAcceptEncoding',
      'MaybeSetBasicAuthHeaders',
      'SendRequestOutgoing',
    ])
  })

  describe('ExtractIsAUTFrameHeader', () => {
    const { ExtractIsAUTFrameHeader } = RequestMiddleware

    it('removes x-cypress-is-aut-frame header when it exists, sets in on the req', async () => {
      const ctx = {
        req: {
          headers: {
            'x-cypress-is-aut-frame': 'true',
          },
        } as Partial<CypressIncomingRequest>,
      }

      await testMiddleware([ExtractIsAUTFrameHeader], ctx)
      .then(() => {
        expect(ctx.req.headers['x-cypress-is-aut-frame']).not.to.exist
        expect(ctx.req.isAUTFrame).to.be.true
      })
    })

    it('removes x-cypress-is-aut-frame header when it does not exist, sets in on the req', async () => {
      const ctx = {
        req: {
          headers: {},
        } as Partial<CypressIncomingRequest>,
      }

      await testMiddleware([ExtractIsAUTFrameHeader], ctx)
      .then(() => {
        expect(ctx.req.headers['x-cypress-is-aut-frame']).not.to.exist
        expect(ctx.req.isAUTFrame).to.be.false
      })
    })
  })

  describe('MaybeEndRequestWithBufferedResponse', () => {
    const { MaybeEndRequestWithBufferedResponse } = RequestMiddleware

    it('sets wantsInjection to full when a request is buffered', async () => {
      const buffers = new HttpBuffers()
      const buffer = { url: 'https://www.cypress.io/', isMultiDomain: false } as HttpBuffer

      buffers.set(buffer)

      const ctx = {
        buffers,
        req: {
          proxiedUrl: 'https://www.cypress.io/',
        },
        res: {} as Partial<CypressOutgoingResponse>,
      }

      await testMiddleware([MaybeEndRequestWithBufferedResponse], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('full')
      })
    })

    it('sets wantsInjection to fullMultiDomain when a multi-domain request is buffered', async () => {
      const buffers = new HttpBuffers()
      const buffer = { url: 'https://www.cypress.io/', isMultiDomain: true } as HttpBuffer

      buffers.set(buffer)

      const ctx = {
        buffers,
        req: {
          proxiedUrl: 'https://www.cypress.io/',
        },
        res: {} as Partial<CypressOutgoingResponse>,
      }

      await testMiddleware([MaybeEndRequestWithBufferedResponse], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('fullMultiDomain')
      })
    })

    it('wantsInjection is not set when the request is not buffered', async () => {
      const buffers = new HttpBuffers()
      const buffer = { url: 'https://www.cypress.io/', isMultiDomain: true } as HttpBuffer

      buffers.set(buffer)

      const ctx = {
        buffers,
        req: {
          proxiedUrl: 'https://www.not-cypress.io/',
        },
        res: {} as Partial<CypressOutgoingResponse>,
      }

      await testMiddleware([MaybeEndRequestWithBufferedResponse], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.be.undefined
      })
    })
  })
})
