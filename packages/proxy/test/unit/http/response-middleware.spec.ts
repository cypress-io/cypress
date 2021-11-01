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
      'AttachPlainTextStreamFn',
      'InterceptResponse',
      'PatchExpressSetHeader',
      'MaybeDelayForMultidomain',
      'SetInjectionLevel',
      'OmitProblematicHeaders',
      'MaybePreventCaching',
      'MaybeStripDocumentDomainFeaturePolicy',
      'CopyCookiesFromIncomingRes',
      'MaybeSendRedirectToClient',
      'CopyResponseStatusCode',
      'ClearCyInitialCookie',
      'MaybeEndWithEmptyBody',
      'MaybeInjectHtml',
      'MaybeRemoveSecurity',
      'GzipBody',
      'SendResponseBodyToClient',
    ])
  })

  describe('MaybeStripDocumentDomainFeaturePolicy', function () {
    const { MaybeStripDocumentDomainFeaturePolicy } = ResponseMiddleware
    let ctx
    let featurePolicyDirectives: any

    beforeEach(function () {
      featurePolicyDirectives = {
        autoplay: '\'self\'',
        camera: '*',
        'document-domain': '\'none\'',
      }
    })

    describe('when no feature-policy header is present', function () {
      beforeEach(function () {
        featurePolicyDirectives = {}
        prepareContext()
      })

      it('doesn\'t do anything', function () {
        return testMiddleware([MaybeStripDocumentDomainFeaturePolicy], ctx)
        .then(() => {
          expect(ctx.res.set).not.to.be.called
        })
      })
    })

    describe('when no document-domain directive is present', function () {
      beforeEach(function () {
        delete featurePolicyDirectives['document-domain']
        prepareContext()
      })

      it('doesn\'t do anything', function () {
        return testMiddleware([MaybeStripDocumentDomainFeaturePolicy], ctx)
        .then(() => {
          expect(ctx.res.set).not.to.be.called
        })
      })
    })

    describe('when both feature-policy header and document-domain directive are present', function () {
      describe('when there are also other directives', function () {
        beforeEach(function () {
          prepareContext()
        })

        it('removes the document-domain directive from the header and keeps the rest', function () {
          return testMiddleware([MaybeStripDocumentDomainFeaturePolicy], ctx)
          .then(() => {
            const [, featurePolicy] = ctx.res.set.args[0]
            const directives = _.fromPairs(featurePolicy.split('; ').map((directive) => directive.split(' ')))

            expect(directives['document-domain']).not.to.exist
            expect(directives['autoplay']).to.exist
            expect(directives['camera']).to.exist
          })
        })
      })

      describe('when it is the only directive', function () {
        beforeEach(function () {
          featurePolicyDirectives = _.pick(featurePolicyDirectives, 'document-domain')
          prepareContext()
        })

        it('removes the whole header', function () {
          return testMiddleware([MaybeStripDocumentDomainFeaturePolicy], ctx)
          .then(() => {
            expect(ctx.res.removeHeader).to.be.calledWith('feature-policy')
          })
        })
      })
    })

    function prepareContext () {
      const headers = {
        pragma: 'no-cache',
        'referrer-policy': 'same-origin',
      }

      if (!_.isEmpty(featurePolicyDirectives)) {
        headers['feature-policy'] = _.toPairs(featurePolicyDirectives).map(
          (directive) => directive.join(' '),
        ).join('; ')
      }

      ctx = {
        res: {
          set: sinon.stub(),
          removeHeader: sinon.stub(),
        },
        incomingRes: {
          headers,
        },
      }
    }
  })

  describe('MaybeDelayForMultidomain', function () {
    const { MaybeDelayForMultidomain } = ResponseMiddleware
    let ctx

    it('doesn\'t do anything when not html or rendered html', function () {
      prepareContext({})

      return testMiddleware([MaybeDelayForMultidomain], ctx)
      .then(() => {
        expect(ctx.serverBus.emit).not.to.be.called
      })
    })

    it('waits for server signal if res is html', function () {
      prepareContext({
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
      })

      const promise = testMiddleware([MaybeDelayForMultidomain], ctx)

      expect(ctx.serverBus.emit).to.be.calledWith('delaying:cross:domain:html')

      ctx.serverBus.once.withArgs('ready:for:domain').args[0][1]()

      return promise
    })

    it('waits for server signal if incomingRes is rendered html', function () {
      prepareContext({
        req: {
          headers: {
            'accept': [
              'text/html',
              'application/xhtml+xml',
            ],
          },
        },
      })

      const promise = testMiddleware([MaybeDelayForMultidomain], ctx)

      expect(ctx.serverBus.emit).to.be.calledWith('delaying:cross:domain:html')

      ctx.serverBus.once.withArgs('ready:for:domain').args[0][1]()

      return promise
    })

    function prepareContext (props) {
      ctx = {
        incomingRes: {
          headers: {},
          ...props.incomingRes,
        },
        res: {
          headers: {},
          ...props.res,
        },
        req: {
          proxiedUrl: 'http:127.0.0.1:3501/multidomain.html',
          headers: {},
          ...props.req,
        },
        serverBus: {
          emit: sinon.stub(),
          once: sinon.stub(),
        },
        debug () {},
      }
    }
  })
})
