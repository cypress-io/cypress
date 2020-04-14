import _ from 'lodash'
import ResponseMiddleware from '../../../lib/http/response-middleware'
import { expect } from 'chai'
import sinon from 'sinon'
import {
  testMiddleware,
} from './helpers'

describe('http/response-middleware', function () {
  it('exports the members in the correct order', function () {
    expect(_.keys(ResponseMiddleware)).to.have.ordered.members([
      'LogResponse',
      'PatchExpressSetHeader',
      'SetInjectionLevel',
      'OmitProblematicHeaders',
      'MaybePreventCaching',
      'CopyCookiesFromIncomingRes',
      'MaybeSendRedirectToClient',
      'CopyResponseStatusCode',
      'ClearCyInitialCookie',
      'MaybeEndWithEmptyBody',
      'MaybeGunzipBody',
      'MaybeInjectHtml',
      'MaybeRemoveSecurity',
      'GzipBody',
      'SendResponseBodyToClient',
    ])
  })

  describe('OmitProblematicHeaders', function () {
    let ctx
    const { OmitProblematicHeaders } = ResponseMiddleware
    const headers = {
      pragma: 'no-cache',
      'feature-policy': 'autoplay \'self\'; document-domain \'none\', camera \'none\'',
      'referrer-policy': 'same-origin',
    }

    beforeEach(function () {
      ctx = {
        res: {
          set: sinon.stub(),
        },
        incomingRes: {
          headers,
        },
      }
    })

    it('removes the feature-policy header', function () {
      return testMiddleware([OmitProblematicHeaders], ctx)
      .then(() => {
        const expectedHeaders = _.omit(headers, 'feature-policy')

        expect(ctx.res.set).to.be.calledWith(expectedHeaders)
      })
    })
  })
})
