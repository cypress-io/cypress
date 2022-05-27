import _ from 'lodash'
import ResponseMiddleware from '../../../lib/http/response-middleware'
import { debugVerbose } from '../../../lib/http'
import { expect } from 'chai'
import sinon from 'sinon'
import { testMiddleware } from './helpers'
import { RemoteStates } from '@packages/server/lib/remote_states'
import EventEmitter from 'events'

describe('http/response-middleware', function () {
  it('exports the members in the correct order', function () {
    expect(_.keys(ResponseMiddleware)).to.have.ordered.members([
      'LogResponse',
      'AttachPlainTextStreamFn',
      'InterceptResponse',
      'PatchExpressSetHeader',
      'MaybeDelayForCrossOrigin',
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

      it(`doesn't do anything`, function () {
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

      it(`doesn't do anything`, function () {
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

  describe('MaybeDelayForCrossOrigin', function () {
    const { MaybeDelayForCrossOrigin } = ResponseMiddleware
    let ctx

    it('doesn\'t do anything when not html or rendered html', function () {
      prepareContext({})

      return testMiddleware([MaybeDelayForCrossOrigin], ctx)
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

      return testMiddleware([MaybeDelayForCrossOrigin], ctx)
      .then(() => {
        expect(ctx.serverBus.emit).not.to.be.called
      })
    })

    it('doesn\'t do anything when "experimentalSessionAndOrigin" config flag is not set to true"', function () {
      prepareContext({
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
      })

      return testMiddleware([MaybeDelayForCrossOrigin], ctx)
      .then(() => {
        expect(ctx.serverBus.emit).not.to.be.called
      })
    })

    it('doesn\'t do anything when request is for a previous origin in the stack', function () {
      prepareContext({
        req: {
          isAUTFrame: true,
          proxiedUrl: 'http://www.foobar.com/test',
        },
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
        secondaryOrigins: ['http://foobar.com', 'http://example.com'],
        config: {
          experimentalSessionAndOrigin: true,
        },
      })

      return testMiddleware([MaybeDelayForCrossOrigin], ctx)
      .then(() => {
        expect(ctx.serverBus.emit).not.to.be.called
      })
    })

    it('waits for server signal if req is not of a previous origin, letting it continue after receiving cross:origin:release:html', function () {
      prepareContext({
        req: {
          isAUTFrame: true,
          proxiedUrl: 'http://www.idp.com/test',
        },
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
        secondaryOrigins: ['http://foobar.com', 'http://example.com'],
        config: {
          experimentalSessionAndOrigin: true,
        },
      })

      const promise = testMiddleware([MaybeDelayForCrossOrigin], ctx)

      expect(ctx.serverBus.emit).to.be.calledWith('cross:origin:delaying:html', { href: 'http://www.idp.com/test' })

      ctx.serverBus.once.withArgs('cross:origin:release:html').args[0][1]()

      return promise
    })

    it('waits for server signal if res is html, letting it continue after receiving cross:origin:release:html', function () {
      prepareContext({
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
        req: {
          isAUTFrame: true,
          proxiedUrl: 'http://www.foobar.com/test',
        },
        config: {
          experimentalSessionAndOrigin: true,
        },
      })

      const promise = testMiddleware([MaybeDelayForCrossOrigin], ctx)

      expect(ctx.serverBus.emit).to.be.calledWith('cross:origin:delaying:html', { href: 'http://www.foobar.com/test' })

      ctx.serverBus.once.withArgs('cross:origin:release:html').args[0][1]()

      return promise
    })

    it('waits for server signal if incomingRes is rendered html, letting it continue after receiving cross:origin:release:html', function () {
      prepareContext({
        req: {
          headers: {
            'accept': [
              'text/html',
              'application/xhtml+xml',
            ],
          },
          isAUTFrame: true,
          proxiedUrl: 'http://www.foobar.com/test',
        },
        config: {
          experimentalSessionAndOrigin: true,
        },
      })

      const promise = testMiddleware([MaybeDelayForCrossOrigin], ctx)

      expect(ctx.serverBus.emit).to.be.calledWith('cross:origin:delaying:html', { href: 'http://www.foobar.com/test' })

      ctx.serverBus.once.withArgs('cross:origin:release:html').args[0][1]()

      return promise
    })

    function prepareContext (props) {
      const remoteStates = new RemoteStates(() => {})
      const eventEmitter = new EventEmitter()

      // set the primary remote state
      remoteStates.set('http://127.0.0.1:3501')

      // set the secondary remote states
      remoteStates.addEventListeners(eventEmitter)
      props.secondaryOrigins?.forEach((originPolicy) => {
        eventEmitter.emit('cross:origin:bridge:ready', { originPolicy })
      })

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
          proxiedUrl: 'http://127.0.0.1:3501/primary-origin.html',
          headers: {},
          ...props.req,
        },
        serverBus: {
          emit: sinon.stub(),
          once: sinon.stub(),
        },
        remoteStates,
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

    it('doesn\'t inject anything when html does not match origin policy and "experimentalSessionAndOrigin" config flag is NOT set to true', function () {
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

    it('injects "fullCrossOrigin" when "experimentalSessionAndOrigin" config flag is set to true for cross-origin html"', function () {
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
        secondaryOrigins: ['http://foobar.com'],
        config: {
          experimentalSessionAndOrigin: true,
        },
      })

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('fullCrossOrigin')
      })
    })

    it('injects "fullCrossOrigin" when request is in origin stack for cross-origin html"', function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://example.com',
          isAUTFrame: true,
          cookies: {},
          headers: {},
        },
        incomingRes: {
          headers: {
            'content-type': 'text/html',
          },
        },
        secondaryOrigins: ['http://example.com', 'http://foobar.com'],
        config: {
          experimentalSessionAndOrigin: true,
        },
      })

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('fullCrossOrigin')
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

    it('injects partial when request is for top-level origin', function () {
      prepareContext({
        renderedHTMLOrigins: {},
        getRenderedHTMLOrigins () {
          return this.renderedHTMLOrigins
        },
        req: {
          proxiedUrl: 'http://127.0.0.1:3501/',
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
        secondaryOrigins: ['http://foobar.com'],
        config: {
          experimentalSessionAndOrigin: true,
        },
      })

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('partial')
      })
    })

    it('does not set Origin-Agent-Cluster header to false when injection is not expected', function () {
      prepareContext({})

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.setHeader).not.to.be.calledWith('Origin-Agent-Cluster', '?0')
      })
    })

    it('sets Origin-Agent-Cluster header to false when injection is expected', function () {
      prepareContext({
        incomingRes: {
          headers: {
            // simplest way to make injection expected
            'x-cypress-file-server-error': true,
          },
        },
      })

      return testMiddleware([SetInjectionLevel], ctx)
      .then(() => {
        expect(ctx.res.setHeader).to.be.calledWith('Origin-Agent-Cluster', '?0')
      })
    })

    function prepareContext (props) {
      const remoteStates = new RemoteStates(() => {})
      const eventEmitter = new EventEmitter()

      // set the primary remote state
      remoteStates.set('http://127.0.0.1:3501')

      // set the secondary remote states
      remoteStates.addEventListeners(eventEmitter)
      props.secondaryOrigins?.forEach((originPolicy) => {
        eventEmitter.emit('cross:origin:bridge:ready', { originPolicy })
      })

      ctx = {
        incomingRes: {
          headers: {},
          ...props.incomingRes,
        },
        res: {
          headers: {},
          setHeader: sinon.stub(),
          ...props.res,
        },
        req: {
          proxiedUrl: 'http://127.0.0.1:3501/primary-origin.html',
          headers: {},
          cookies: {
            '__cypress.initial': true,
          },
          ...props.req,
        },
        remoteStates,
        debug: (formatter, ...args) => {
          debugVerbose(`%s %s %s ${formatter}`, ctx.req.method, ctx.req.proxiedUrl, ctx.stage, ...args)
        },
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
            proxiedUrl: 'http://www.foobar.com/primary-origin.html',
          },
          res: {
            append: appendStub,
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
            proxiedUrl: 'http://www.foobar.com/primary-origin.html',
          },
          res: {
            append: appendStub,
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
            experimentalSessionAndOrigin: false,
          },
        })

        await testMiddleware([CopyCookiesFromIncomingRes], ctx)

        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
      })

      describe('cookie modification scenarios', function () {
        const makeScenarios = (output, flippedOutput?) => {
          return [
            ['SameSite=Strict; Secure', output],
            ['SameSite=Strict', output],
            ['SameSite=Lax; Secure', output],
            ['SameSite=Lax', output],
            ['SameSite=Invalid; Secure', output],
            ['SameSite=Invalid', output],
            ['SameSite=None', output],
            ['', output],
            // When Secure is first or there's no SameSite, it ends up as
            // "Secure; SameSite=None" instead of "Secure" being second
            ['Secure', flippedOutput || output],
            ['Secure; SameSite=None', flippedOutput || output],
          ]
        }

        const withFirefox = {
          getCurrentBrowser: () => ({ family: 'firefox' }),
        }

        describe('not Firefox', function () {
          makeScenarios('SameSite=None; Secure', 'Secure; SameSite=None').forEach(([input, output]) => {
            it(`${input} -> ${output}`, async function () {
              const { appendStub, ctx } = prepareContextWithCookie(`insecure=true; cookie=value${input ? '; ' : ''}${input}`)

              await testMiddleware([CopyCookiesFromIncomingRes], ctx)

              expect(appendStub).to.be.calledOnce
              expect(appendStub).to.be.calledWith('Set-Cookie', `insecure=true; cookie=value; ${output}`)
            })
          })
        })

        describe('Firefox + non-localhost', function () {
          makeScenarios('SameSite=None; Secure', 'Secure; SameSite=None').forEach(([input, output]) => {
            it(`${input} -> ${output}`, async function () {
              const { appendStub, ctx } = prepareContextWithCookie(`insecure=true; cookie=value${input ? '; ' : ''}${input}`, {
                req: { proxiedUrl: 'https://foobar.com' },
                ...withFirefox,
              })

              await testMiddleware([CopyCookiesFromIncomingRes], ctx)

              expect(appendStub).to.be.calledOnce
              expect(appendStub).to.be.calledWith('Set-Cookie', `insecure=true; cookie=value; ${output}`)
            })
          })
        })

        describe('Firefox + https://localhost', function () {
          makeScenarios('SameSite=None; Secure', 'Secure; SameSite=None').forEach(([input, output]) => {
            it(`${input} -> ${output}`, async function () {
              const { appendStub, ctx } = prepareContextWithCookie(`insecure=true; cookie=value${input ? '; ' : ''}${input}`, {
                req: { proxiedUrl: 'https://localhost:3500' },
                ...withFirefox,
              })

              await testMiddleware([CopyCookiesFromIncomingRes], ctx)

              expect(appendStub).to.be.calledOnce
              expect(appendStub).to.be.calledWith('Set-Cookie', `insecure=true; cookie=value; ${output}`)
            })
          })
        })

        describe('Firefox + http://localhost', function () {
          makeScenarios('SameSite=None').forEach(([input, output]) => {
            it(`${input} -> ${output}`, async function () {
              const { appendStub, ctx } = prepareContextWithCookie(`insecure=true; cookie=value${input ? '; ' : ''}${input}`, withFirefox)

              await testMiddleware([CopyCookiesFromIncomingRes], ctx)

              expect(appendStub).to.be.calledOnce
              expect(appendStub).to.be.calledWith('Set-Cookie', `insecure=true; cookie=value; ${output}`)
            })
          })
        })
      })
    })

    function prepareContext (props) {
      const remoteStates = new RemoteStates(() => {})
      const eventEmitter = new EventEmitter()

      // set the primary remote state
      remoteStates.set('http://foobar.com')

      // set the secondary remote states
      remoteStates.addEventListeners(eventEmitter)
      props.secondaryOrigins?.forEach((originPolicy) => {
        eventEmitter.emit('cross:origin:bridge:ready', { originPolicy })
      })

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
          proxiedUrl: 'http://127.0.0.1:3501/primary-origin.html',
          headers: {},
          ...props.req,
        },
        incomingResStream: {
          pipe () {
            return { on () {} }
          },
        },
        config: {
          experimentalSessionAndOrigin: true,
        },
        getCurrentBrowser () {
          return { family: 'chromium' }
        },
        getPreviousAUTRequestUrl () {},
        remoteStates,
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
