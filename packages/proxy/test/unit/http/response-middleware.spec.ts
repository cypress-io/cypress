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

    it('doesn\'t do anything when "experimentalMultiDomain" config flag is not set to true"', function () {
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
          proxiedUrl: 'protocol://host/originalUrl',
        },
        config: {
          experimentalMultiDomain: true,
        },
      })

      const promise = testMiddleware([MaybeDelayForMultiDomain], ctx)

      expect(ctx.serverBus.emit).to.be.calledWith('cross:domain:delaying:html', { href: 'protocol://host/originalUrl' })

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
          proxiedUrl: 'protocol://host/originalUrl',
        },
        config: {
          experimentalMultiDomain: true,
        },
      })

      const promise = testMiddleware([MaybeDelayForMultiDomain], ctx)

      expect(ctx.serverBus.emit).to.be.calledWith('cross:domain:delaying:html', { href: 'protocol://host/originalUrl' })

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
          proxiedUrl: 'http://127.0.0.1:3501/multi-domain.html',
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

  describe('SetInjectionLevel', function () {
    const { SetInjectionLevel } = ResponseMiddleware
    let ctx

    it('doesn\'t inject anything when not html', function () {
      prepareContext({
        req: {
          cookies: {},
          headers: {},
        },
      })

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.be.false
      })
    })

    it('doesn\'t inject anything when not rendered html', function () {
      prepareContext({
        renderedHTMLOrigins: {},
        getRenderedHTMLOrigins () {
          return this.renderedHTMLOrigins
        },
        req: {
          cookies: {},
          headers: {},
        },
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
      })

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.be.false
      })
    })

    it('doesn\'t inject anything when not AUT frame', function () {
      prepareContext({
        req: {
          cookies: {},
          headers: {},
        },
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
      })

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.be.false
      })
    })

    it('doesn\'t inject anything when html does not match origin policy and "experimentalMultiDomain" config flag is NOT set to true', function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://foobar.com',
          isAUTFrame: true,
          cookies: {},
          headers: {},
        },
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
      })

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.be.false
      })
    })

    it('injects "fullMultiDomain" when "experimentalMultiDomain" config flag is set to true for cross-domain html"', function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://foobar.com',
          isAUTFrame: true,
          cookies: {},
          headers: {},
        },
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
        config: {
          experimentalMultiDomain: true,
        },
      })

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('fullMultiDomain')
      })
    })

    it('performs full injection on initial AUT html origin', function () {
      prepareContext({
        req: {
          isAUTFrame: true,
          cookies: {
            '__cypress.initial': 'true',
          },
          headers: {},
        },
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
      })

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('full')
      })
    })

    it('otherwise, partial injection is set', function () {
      prepareContext({
        renderedHTMLOrigins: {},
        getRenderedHTMLOrigins () {
          return this.renderedHTMLOrigins
        },
        req: {
          proxiedUrl: 'http://foobar.com',
          isAUTFrame: true,
          cookies: {},
          headers: {
            'accept': [
              'text/html',
              'application/xhtml+xml',
            ],
          },
        },
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
      })

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('partial')
      })
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
          proxiedUrl: 'http://127.0.0.1:3501/multi-domain.html',
          headers: {},
          ...props.req,
        },
        getRemoteState () {
          return {
            strategy: 'http',
            props: {
              port: '3501', tld: '127.0.0.1', domain: '',
            },
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
    const { CopyCookiesFromIncomingRes } = ResponseMiddleware

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
      const makeVarieties = (output, flippedOutput?) => {
        return [
          ['SameSite=Strict; Secure', output],
          ['SameSite=Strict', output],
          ['SameSite=Lax; Secure', output],
          ['SameSite=Lax', output],
          ['SameSite=Invalid; Secure', output],
          ['SameSite=Invalid', output],
          ['SameSite=None', output],
          ['', output],
          // When there's Secure and no SameSite, it ends up as
          // "Secure; SameSite=None" instead of "Secure" being second
          ['Secure', flippedOutput || output],
        ]
      }

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
        const ctx = prepareContext({
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
          getPreviousAUTRequestUrl () {
            return 'https://different.site'
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

        ctx.getPreviousAUTRequestUrl = () => ctx.req.proxiedUrl

        await testMiddleware([CopyCookiesFromIncomingRes], ctx)

        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
      })

      it('does not force SameSite=None if experimental flag is off', async function () {
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
          config: {
            experimentalMultiDomain: false,
          },
        })

        await testMiddleware([CopyCookiesFromIncomingRes], ctx)

        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
      })

      describe('cookie modification specifics - not Firefox', function () {
        makeVarieties('SameSite=None; Secure', 'Secure; SameSite=None').forEach(([input, output]) => {
          it(`${input} -> ${output}`, async function () {
            const { appendStub, ctx } = prepareContextWithCookie(`cookie=value${input ? '; ' : ''}${input}`)

            await testMiddleware([CopyCookiesFromIncomingRes], ctx)

            expect(appendStub).to.be.calledOnce
            expect(appendStub).to.be.calledWith('Set-Cookie', `cookie=value; ${output}`)
          })
        })
      })

      const withFirefox = {
        getCurrentBrowser: () => ({ family: 'firefox' }),
      }

      describe('cookie modification specifics - Firefox + non-localhost', function () {
        makeVarieties('SameSite=None; Secure', 'Secure; SameSite=None').forEach(([input, output]) => {
          it(`${input} -> ${output}`, async function () {
            const { appendStub, ctx } = prepareContextWithCookie(`cookie=value${input ? '; ' : ''}${input}`, {
              req: { proxiedUrl: 'https://foobar.com' },
              ...withFirefox,
            })

            await testMiddleware([CopyCookiesFromIncomingRes], ctx)

            expect(appendStub).to.be.calledOnce
            expect(appendStub).to.be.calledWith('Set-Cookie', `cookie=value; ${output}`)
          })
        })
      })

      describe('cookie modification specifics - Firefox + https://localhost', function () {
        makeVarieties('SameSite=None; Secure', 'Secure; SameSite=None').forEach(([input, output]) => {
          it(`${input} -> ${output}`, async function () {
            const { appendStub, ctx } = prepareContextWithCookie(`cookie=value${input ? '; ' : ''}${input}`, {
              req: { proxiedUrl: 'https://localhost:3500' },
              ...withFirefox,
            })

            await testMiddleware([CopyCookiesFromIncomingRes], ctx)

            expect(appendStub).to.be.calledOnce
            expect(appendStub).to.be.calledWith('Set-Cookie', `cookie=value; ${output}`)
          })
        })
      })

      describe('cookie modification specifics - Firefox + http://localhost', function () {
        makeVarieties('SameSite=None').forEach(([input, output]) => {
          it(`${input} -> ${output}`, async function () {
            const { appendStub, ctx } = prepareContextWithCookie(`cookie=value${input ? '; ' : ''}${input}`, withFirefox)

            await testMiddleware([CopyCookiesFromIncomingRes], ctx)

            expect(appendStub).to.be.calledOnce
            expect(appendStub).to.be.calledWith('Set-Cookie', `cookie=value; ${output}`)
          })
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
        config: {
          experimentalMultiDomain: true,
        },
        getCurrentBrowser () {
          return { family: 'chromium' }
        },
        getPreviousAUTRequestUrl () {},
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

    function prepareContextWithCookie (cookie, props: any = {}) {
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
          ...props.req,
        },
        res: {
          append: appendStub,
        },
        ..._.omit(props, 'incomingRes', 'res', 'req'),
      })

      return { appendStub, ctx }
    }
  })
})
