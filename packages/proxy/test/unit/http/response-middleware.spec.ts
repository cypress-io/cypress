import _ from 'lodash'
import ResponseMiddleware from '../../../lib/http/response-middleware'
import { expect } from 'chai'

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
})
