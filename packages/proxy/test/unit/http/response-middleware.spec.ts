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
      'MaybeDelayForMultiDomain',
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

  describe('MaybeDelayForMultiDomain', function () {
    const { MaybeDelayForMultiDomain } = ResponseMiddleware
    let ctx

    it('doesn\'t do anything when not html or rendered html', function () {
      prepareContext({})

      return testMiddleware([MaybeDelayForMultiDomain], ctx)
      .then(() => {
        expect(ctx.serverBus.emit).not.to.be.called
      })
    })

    it('doesn\'t do anything when not AUT frame', function () {
      prepareContext({
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
      })

      return testMiddleware([MaybeDelayForMultiDomain], ctx)
      .then(() => {
        expect(ctx.serverBus.emit).not.to.be.called
      })
    })

    it('waits for server signal if res is html, letting it continue after receiving ready:for:domain', function () {
      prepareContext({
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
        req: {
          isAUTFrame: true,
        },
      })

      const promise = testMiddleware([MaybeDelayForMultiDomain], ctx)

      expect(ctx.serverBus.emit).to.be.calledWith('cross:domain:delaying:html')

      ctx.serverBus.once.withArgs('ready:for:domain').args[0][1]()

      return promise
    })

    it('waits for server signal if incomingRes is rendered html, letting it continue after receiving ready:for:domain', function () {
      prepareContext({
        req: {
          headers: {
            'accept': [
              'text/html',
              'application/xhtml+xml',
            ],
          },
          isAUTFrame: true,
        },
      })

      const promise = testMiddleware([MaybeDelayForMultiDomain], ctx)

      expect(ctx.serverBus.emit).to.be.calledWith('cross:domain:delaying:html')

      ctx.serverBus.once.withArgs('ready:for:domain').args[0][1]()

      expect(ctx.res.wantsInjection).to.be.undefined

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
          proxiedUrl: 'http:127.0.0.1:3501/multi-domain.html',
          headers: {},
          ...props.req,
        },
        serverBus: {
          emit: sinon.stub(),
          once: sinon.stub(),
        },
        getRemoteState () {
          return {
            strategy: 'foo',
          }
        },
        debug () {},
        onError (error) {
          throw error
        },
        ..._.omit(props, 'incomingRes', 'res', 'req'),
      }
    }
  })

  describe('CopyCookiesFromIncomingRes', function () {
    const { CopyCookiesFromIncomingRes, SendResponseBodyToClient } = ResponseMiddleware

    it('appends cookies on the response when an array', async function () {
      const appendStub = sinon.stub()
      const ctx = prepareContext({
        incomingRes: {
          headers: {
            'set-cookie': ['cookie1=value1', 'cookie2=value2'],
          },
        },
        res: {
          append: appendStub,
        },
      })

      await testMiddleware([CopyCookiesFromIncomingRes], ctx)

      expect(appendStub).to.be.calledTwice
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie1=value1')
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie2=value2')
    })

    it('appends cookies on the response when a string', async function () {
      const appendStub = sinon.stub()
      const ctx = prepareContext({
        incomingRes: {
          headers: {
            'set-cookie': 'cookie=value',
          },
        },
        res: {
          append: appendStub,
        },
      })

      await testMiddleware([CopyCookiesFromIncomingRes], ctx)

      expect(appendStub).to.be.calledOnce
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
    })

    it('is a noop when cookies are undefined', async function () {
      const appendStub = sinon.stub()
      const ctx = prepareContext({
        res: {
          append: appendStub,
        },
      })

      await testMiddleware([CopyCookiesFromIncomingRes], ctx)

      expect(appendStub).not.to.be.called
    })

    describe('SameSite', function () {
      it('forces SameSite=None when an AUT request and does not match origin policy', async function () {
        const appendStub = sinon.stub()
        const ctx = prepareContext({
          incomingRes: {
            headers: {
              'content-type': 'text/html',
              'set-cookie': 'cookie=value',
            },
          },
          req: {
            isAUTFrame: true,
          },
          res: {
            append: appendStub,
          },
        })

        await testMiddleware([CopyCookiesFromIncomingRes], ctx)

        expect(appendStub).to.be.calledOnce
        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value; SameSite=None; Secure')
      })

      it('forces SameSite=None when an AUT request and last AUT request was a different origin', async function () {
        const appendStub = sinon.stub()
        const ctx1 = prepareContext({
          req: {
            isAUTFrame: true,
            proxiedUrl: 'https://site1.com',
          },
        })
        const ctx2 = prepareContext({
          incomingRes: {
            headers: {
              'content-type': 'text/html',
              'set-cookie': 'cookie=value',
            },
          },
          req: {
            isAUTFrame: true,
            proxiedUrl: 'https://site2.com',
          },
          res: {
            append: appendStub,
          },
          getRemoteState () {
            // nonsense, but it's the simplest way to match origin policy
            return {
              strategy: 'file',
              origin: 'http',
            }
          },
        })

        SendResponseBodyToClient.call(ctx1)
        await testMiddleware([CopyCookiesFromIncomingRes], ctx2)

        expect(appendStub).to.be.calledOnce
        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value; SameSite=None; Secure')
      })

      it('does not force SameSite=None if not an AUT request', async function () {
        const appendStub = sinon.stub()
        const ctx = prepareContext({
          incomingRes: {
            headers: {
              'content-type': 'text/html',
              'set-cookie': 'cookie=value',
            },
          },
          res: {
            append: appendStub,
          },
        })

        await testMiddleware([CopyCookiesFromIncomingRes], ctx)

        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
      })

      it('does not force SameSite=None if the first AUT request', async function () {
        const appendStub = sinon.stub()
        const ctx = prepareContext({
          incomingRes: {
            headers: {
              'content-type': 'text/html',
              'set-cookie': 'cookie=value',
            },
          },
          req: {
            isAUTFrame: true,
          },
          res: {
            append: appendStub,
          },
          getRemoteState () {
            // nonsense, but it's the simplest way to match origin policy
            return {
              strategy: 'file',
              origin: 'http',
            }
          },
        })

        await testMiddleware([CopyCookiesFromIncomingRes], ctx)

        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
      })

      it('does not force SameSite=None if an AUT request but not cross-origin', async function () {
        const appendStub = sinon.stub()
        const ctx1 = prepareContext({
          req: {
            isAUTFrame: true,
          },
        })
        const ctx2 = prepareContext({
          incomingRes: {
            headers: {
              'content-type': 'text/html',
              'set-cookie': 'cookie=value',
            },
          },
          req: {
            isAUTFrame: true,
          },
          res: {
            append: appendStub,
          },
          getRemoteState () {
            // nonsense, but it's the simplest way to match origin policy
            return {
              strategy: 'file',
              origin: 'http',
            }
          },
        })

        SendResponseBodyToClient.call(ctx1)
        await testMiddleware([CopyCookiesFromIncomingRes], ctx2)

        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
      })

      describe('cookie modification specifics', function () {
        it('SameSite=Strict; Secure -> SameSite=None; Secure', async function () {
          const { appendStub, ctx } = prepareContextWithCookie('cookie=value; SameSite=Strict; Secure')

          await testMiddleware([CopyCookiesFromIncomingRes], ctx)

          expect(appendStub).to.be.calledOnce
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value; SameSite=None; Secure')
        })

        it('SameSite=Strict -> SameSite=None; Secure', async function () {
          const { appendStub, ctx } = prepareContextWithCookie('cookie=value; SameSite=Strict')

          await testMiddleware([CopyCookiesFromIncomingRes], ctx)

          expect(appendStub).to.be.calledOnce
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value; SameSite=None; Secure')
        })

        it('SameSite=Lax; Secure -> SameSite=None; Secure', async function () {
          const { appendStub, ctx } = prepareContextWithCookie('cookie=value; SameSite=Lax; Secure')

          await testMiddleware([CopyCookiesFromIncomingRes], ctx)

          expect(appendStub).to.be.calledOnce
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value; SameSite=None; Secure')
        })

        it('SameSite=Lax -> SameSite=None; Secure', async function () {
          const { appendStub, ctx } = prepareContextWithCookie('cookie=value; SameSite=Lax')

          await testMiddleware([CopyCookiesFromIncomingRes], ctx)

          expect(appendStub).to.be.calledOnce
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value; SameSite=None; Secure')
        })

        it('SameSite=Invalid; Secure -> SameSite=None; Secure', async function () {
          const { appendStub, ctx } = prepareContextWithCookie('cookie=value; SameSite=Invalid; Secure')

          await testMiddleware([CopyCookiesFromIncomingRes], ctx)

          expect(appendStub).to.be.calledOnce
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value; SameSite=None; Secure')
        })

        it('SameSite=Invalid -> SameSite=None; Secure', async function () {
          const { appendStub, ctx } = prepareContextWithCookie('cookie=value; SameSite=Invalid')

          await testMiddleware([CopyCookiesFromIncomingRes], ctx)

          expect(appendStub).to.be.calledOnce
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value; SameSite=None; Secure')
        })

        it('SameSite=None -> SameSite=None; Secure', async function () {
          const { appendStub, ctx } = prepareContextWithCookie('cookie=value; SameSite=None')

          await testMiddleware([CopyCookiesFromIncomingRes], ctx)

          expect(appendStub).to.be.calledOnce
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value; SameSite=None; Secure')
        })

        it('no SameSite -> SameSite=None; Secure', async function () {
          const { appendStub, ctx } = prepareContextWithCookie('cookie=value')

          await testMiddleware([CopyCookiesFromIncomingRes], ctx)

          expect(appendStub).to.be.calledOnce
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value; SameSite=None; Secure')
        })

        it('no SameSite; Secure -> Secure; SameSite=None', async function () {
          const { appendStub, ctx } = prepareContextWithCookie('cookie=value; Secure')

          await testMiddleware([CopyCookiesFromIncomingRes], ctx)

          expect(appendStub).to.be.calledOnce
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value; Secure; SameSite=None')
        })
      })
    })

    function prepareContext (props) {
      return {
        incomingRes: {
          headers: {},
          ...props.incomingRes,
        },
        res: {
          headers: {},
          on () {},
          ...props.res,
        },
        req: {
          proxiedUrl: 'http:127.0.0.1:3501/multi-domain.html',
          headers: {},
          ...props.req,
        },
        incomingResStream: {
          pipe () {
            return { on () {} }
          },
        },
        getRemoteState () {
          return {
            strategy: 'foo',
          }
        },
        debug () {},
        onError (error) {
          throw error
        },
        ..._.omit(props, 'incomingRes', 'res', 'req'),
      }
    }

    function prepareContextWithCookie (cookie) {
      const appendStub = sinon.stub()
      const ctx = prepareContext({
        incomingRes: {
          headers: {
            'content-type': 'text/html',
            'set-cookie': cookie,
          },
        },
        req: {
          isAUTFrame: true,
        },
        res: {
          append: appendStub,
        },
      })

      return { appendStub, ctx }
    }
  })
})
