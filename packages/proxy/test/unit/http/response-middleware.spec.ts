import _ from 'lodash'
import ResponseMiddleware from '../../../lib/http/response-middleware'
import { debugVerbose } from '../../../lib/http'
import { expect } from 'chai'
import sinon from 'sinon'
import { testMiddleware } from './helpers'
import { RemoteStates } from '@packages/server/lib/remote_states'
import { Readable } from 'stream'
import * as rewriter from '../../../lib/http/util/rewriter'

describe('http/response-middleware', function () {
  it('exports the members in the correct order', function () {
    expect(_.keys(ResponseMiddleware)).to.have.ordered.members([
      'LogResponse',
      'AttachPlainTextStreamFn',
      'InterceptResponse',
      'PatchExpressSetHeader',
      'SetInjectionLevel',
      'OmitProblematicHeaders',
      'MaybePreventCaching',
      'MaybeStripDocumentDomainFeaturePolicy',
      'MaybeCopyCookiesFromIncomingRes',
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

  it('errors if this.next() is called more than once in the same middleware', function (done) {
    const middleware = function () {
      this.next()
      this.next()
    }

    testMiddleware([middleware], {
      onError (err) {
        expect(err.message).to.equal('Error running proxy middleware: Cannot call this.next() more than once in the same middleware function. Doing so can cause unintended issues.')

        done()
      },
    })
  })

  it('does not error if this.next() is called more than once in different middleware', function () {
    const middleware1 = function () {
      this.next()
    }
    const middleware2 = function () {
      this.next()
    }

    return testMiddleware([middleware1, middleware2], {
      onError () {
        throw new Error('onError should not be called')
      },
    })
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

    describe('wantsSecurityRemoved', () => {
      it('removes security if full injection is requested', () => {
        prepareContext({
          res: {
            wantsInjection: 'full',
          },
          config: {
            modifyObstructiveCode: true,
          },
        })

        return testMiddleware([SetInjectionLevel], ctx)
        .then(() => {
          expect(ctx.res.wantsSecurityRemoved).to.be.true
        })
      })

      it('removes security if fullCrossOrigin injection is requested', () => {
        prepareContext({
          res: {
            wantsInjection: 'fullCrossOrigin',
          },
          config: {
            modifyObstructiveCode: true,
          },
        })

        return testMiddleware([SetInjectionLevel], ctx)
        .then(() => {
          expect(ctx.res.wantsSecurityRemoved).to.be.true
        })
      })

      ;['application/javascript', 'application/x-javascript', 'text/javascript'].forEach((javascriptMIME) => {
        it(`removes security if the MIME type is ${javascriptMIME} and is on the currently active remote state`, () => {
          prepareContext({
            incomingRes: {
              headers: {
                'content-type': `${javascriptMIME}`,
              },
            },
            config: {
              modifyObstructiveCode: true,
            },
          })

          return testMiddleware([SetInjectionLevel], ctx)
          .then(() => {
            expect(ctx.res.wantsSecurityRemoved).to.be.true
          })
        })
      })

      it('otherwise, does not try to remove security on other MIME Types', () => {
        prepareContext({
          incomingRes: {
            headers: {
              'content-type': 'application/xml',
            },
          },
          config: {
            modifyObstructiveCode: true,
          },
        })

        return testMiddleware([SetInjectionLevel], ctx)
        .then(() => {
          expect(ctx.res.wantsSecurityRemoved).to.be.false
        })
      })

      describe('experimentalModifyObstructiveThirdPartyCode', () => {
        it('continues to "modifyObstructiveCode" when "experimentalModifyObstructiveThirdPartyCode" is true, even if "modifyObstructiveCode" is set to false.', () => {
          prepareContext({
            res: {
              wantsInjection: 'full',
            },
            config: {
              modifyObstructiveCode: false,
              experimentalModifyObstructiveThirdPartyCode: true,
            },
          })

          return testMiddleware([SetInjectionLevel], ctx)
          .then(() => {
            expect(ctx.res.wantsSecurityRemoved).to.be.true
          })
        })

        ;['text/html', 'application/javascript', 'application/x-javascript', 'text/javascript'].forEach((MIMEType) => {
          it(`removes security for ${MIMEType} MIME when "experimentalModifyObstructiveThirdPartyCode" is true, regardless of injection or request origin.`, () => {
            prepareContext({
              req: {
                proxiedUrl: 'http://www.some-third-party-script-or-html.com/',
                isAUTFrame: false,
              },
              incomingRes: {
                headers: {
                  'content-type': `${MIMEType}`,
                },
              },
              config: {
                modifyObstructiveCode: true,
                experimentalModifyObstructiveThirdPartyCode: true,
              },
            })

            return testMiddleware([SetInjectionLevel], ctx)
            .then(() => {
              expect(ctx.res.wantsSecurityRemoved).to.be.true
            })
          })
        })

        it(`removes security when the request will render html when "experimentalModifyObstructiveThirdPartyCode" is true, regardless of injection or request origin.`, () => {
          prepareContext({
            renderedHTMLOrigins: {},
            getRenderedHTMLOrigins () {
              return this.renderedHTMLOrigins
            },
            req: {
              proxiedUrl: 'http://www.some-third-party-script-or-html.com/',
              isAUTFrame: false,
              headers: {
                'accept': ['text/html', 'application/xhtml+xml'],
              },
            },
            config: {
              modifyObstructiveCode: true,
              experimentalModifyObstructiveThirdPartyCode: true,
            },
          })

          return testMiddleware([SetInjectionLevel], ctx)
          .then(() => {
            expect(ctx.res.wantsSecurityRemoved).to.be.true
          })
        })
      })
    })

    function prepareContext (props) {
      const remoteStates = new RemoteStates(() => {})

      // set the primary remote state
      remoteStates.set('http://127.0.0.1:3501')

      // set the secondary remote states
      props.secondaryOrigins?.forEach((origin) => {
        remoteStates.set(origin, {}, false)
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

  describe('MaybeCopyCookiesFromIncomingRes', function () {
    const { MaybeCopyCookiesFromIncomingRes } = ResponseMiddleware

    it('appends cookies on the response when an array', async function () {
      const { appendStub, ctx } = prepareSameOriginContext({
        incomingRes: {
          headers: {
            'set-cookie': ['cookie1=value1', 'cookie2=value2'],
          },
        },
      })

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(appendStub).to.be.calledTwice
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie1=value1')
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie2=value2')
    })

    it('appends cookies on the response when a string', async function () {
      const { appendStub, ctx } = prepareSameOriginContext()

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

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

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(appendStub).not.to.be.called
    })

    it('is a noop in the cookie jar when top does NOT need simulating', async function () {
      const appendStub = sinon.stub()

      const cookieJar = {
        getAllCookies: () => [{ key: 'cookie', value: 'value' }],
        setCookie: sinon.stub(),
      }

      const ctx = prepareContext({
        cookieJar,
        res: {
          append: appendStub,
        },
        incomingRes: {
          headers: {
            'set-cookie': 'cookie=value',
          },
        },
      })

      ctx.getAUTUrl = () => 'http://www.foobar.com/index.html'
      // set the primaryOrigin to true to signal we do NOT need to simulate top
      ctx.remoteStates.isPrimarySuperDomainOrigin = () => true

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(cookieJar.setCookie).not.to.have.been.called
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
    })

    it('is a noop in the cookie jar when experimentalSessionAndOrigin is false', async function () {
      const appendStub = sinon.stub()

      const cookieJar = {
        getAllCookies: () => [{ key: 'cookie', value: 'value' }],
        setCookie: sinon.stub(),
      }

      const ctx = prepareContext({
        cookieJar,
        res: {
          append: appendStub,
        },
        incomingRes: {
          headers: {
            'set-cookie': 'cookie=value',
          },
        },
      })

      ctx.config.experimentalSessionAndOrigin = false

      // a case where top would need to be simulated, but the experimental flag is off
      ctx.getAUTUrl = () => 'http://www.foobar.com/index.html'
      ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(cookieJar.setCookie).not.to.have.been.called
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
    })

    describe('same-origin', () => {
      ['same-origin', 'include'].forEach((credentialLevel) => {
        it(`sets first-party cookie context in the jar when simulating top if credentials included with fetch with credential ${credentialLevel}`, async function () {
          const appendStub = sinon.stub()

          const cookieJar = {
            getAllCookies: () => [{ key: 'cookie', value: 'value' }],
            setCookie: sinon.stub(),
          }

          const ctx = prepareContext({
            cookieJar,
            res: {
              append: appendStub,
            },
            req: {
              // a same-site request that has the ability to set first-party cookies in the browser
              requestedWith: 'fetch',
              credentialsLevel: credentialLevel,
              proxiedUrl: 'https://www.foobar.com/test-request',
            },
            incomingRes: {
              headers: {
                'set-cookie': ['cookie1=value1; SameSite=Strict', 'cookie2=value2; SameSite=Lax', 'cookie3=value3; SameSite=None; Secure'],
              },
            },
          })

          // a case where top would need to be simulated
          ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
          ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

          await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

          // should work as this would be set in the browser if the AUT url was top
          expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
            key: 'cookie1',
            value: 'value1',
            sameSite: 'strict',
          }), 'https://www.foobar.com/test-request', 'strict')

          // should work as this would be set in the browser if the AUT url was top
          expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
            key: 'cookie2',
            value: 'value2',
            sameSite: 'lax',
          }), 'https://www.foobar.com/test-request', 'strict')

          // should work as this would be set in the browser if the AUT url was top, just sets a third party cookie
          expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
            key: 'cookie3',
            value: 'value3',
            sameSite: 'none',
          }), 'https://www.foobar.com/test-request', 'strict')

          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
        })
      })

      ;[true, false].forEach((credentialLevel) => {
        it(`sets first-party cookie context in the jar when simulating top if withCredentials ${credentialLevel} with xhr`, async function () {
          const appendStub = sinon.stub()

          const cookieJar = {
            getAllCookies: () => [{ key: 'cookie', value: 'value' }],
            setCookie: sinon.stub(),
          }

          const ctx = prepareContext({
            cookieJar,
            res: {
              append: appendStub,
            },
            req: {
              // a same-site request that has the ability to set first-party cookies in the browser
              requestedWith: 'xhr',
              credentialsLevel: credentialLevel,
              proxiedUrl: 'https://www.foobar.com/test-request',
            },
            incomingRes: {
              headers: {
                'set-cookie': ['cookie1=value1; SameSite=Strict', 'cookie2=value2; SameSite=Lax', 'cookie3=value3; SameSite=None; Secure'],
              },
            },
          })

          // a case where top would need to be simulated
          ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
          ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

          await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

          // should work as this would be set in the browser if the AUT url was top
          expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
            key: 'cookie1',
            value: 'value1',
            sameSite: 'strict',
          }), 'https://www.foobar.com/test-request', 'strict')

          // should work as this would be set in the browser if the AUT url was top
          expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
            key: 'cookie2',
            value: 'value2',
            sameSite: 'lax',
          }), 'https://www.foobar.com/test-request', 'strict')

          // should work as this would be set in the browser if the AUT url was top, just sets a third party cookie
          expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
            key: 'cookie3',
            value: 'value3',
            sameSite: 'none',
          }), 'https://www.foobar.com/test-request', 'strict')

          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
        })
      })

      it(`sets no cookies if fetch level is omit`, async function () {
        const appendStub = sinon.stub()

        const cookieJar = {
          getAllCookies: () => [{ key: 'cookie', value: 'value' }],
          setCookie: sinon.stub(),
        }

        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a same-site request that has the ability to set first-party cookies in the browser
            requestedWith: 'fetch',
            credentialsLevel: 'omit',
            proxiedUrl: 'https://www.foobar.com/test-request',
          },
          incomingRes: {
            headers: {
              'set-cookie': ['cookie1=value1; SameSite=Strict', 'cookie2=value2; SameSite=Lax', 'cookie3=value3; SameSite=None; Secure'],
            },
          },
        })

        // a case where top would need to be simulated
        ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
        ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

        await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

        // should not work as this wouldn't be set in the browser if the AUT url was top
        expect(cookieJar.setCookie).not.to.have.been.calledWith(sinon.match({
          key: 'cookie1',
          value: 'value1',
          sameSite: 'strict',
        }), 'https://www.foobar.com/test-request', 'strict')

        // should not work as this wouldn't be set in the browser if the AUT url was top
        expect(cookieJar.setCookie).not.to.have.been.calledWith(sinon.match({
          key: 'cookie2',
          value: 'value2',
          sameSite: 'lax',
        }), 'https://www.foobar.com/test-request', 'strict')

        // should not work as this wouldn't be set in the browser if the AUT url was top
        expect(cookieJar.setCookie).not.to.have.been.calledWith(sinon.match({
          key: 'cookie3',
          value: 'value3',
          sameSite: 'none',
        }), 'https://www.foobar.com/test-request', 'strict')

        // return these to the browser, even though they are likely to fail setting anyway
        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })
    })

    describe('same-site', () => {
      it('sets first-party cookie context in the jar when simulating top if credentials included with fetch via include', async function () {
        const appendStub = sinon.stub()

        const cookieJar = {
          getAllCookies: () => [{ key: 'cookie', value: 'value' }],
          setCookie: sinon.stub(),
        }

        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a same-site request that has the ability to set first-party cookies in the browser
            requestedWith: 'fetch',
            credentialsLevel: 'include',
            proxiedUrl: 'https://app.foobar.com/test-request',
          },
          incomingRes: {
            headers: {
              'set-cookie': ['cookie1=value1; SameSite=Strict', 'cookie2=value2; SameSite=Lax', 'cookie3=value3; SameSite=None; Secure'],
            },
          },
        })

        // a case where top would need to be simulated
        ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
        ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

        await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

        // should work as this would be set in the browser if the AUT url was top
        expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
          key: 'cookie1',
          value: 'value1',
          sameSite: 'strict',
        }), 'https://app.foobar.com/test-request', 'strict')

        // should work as this would be set in the browser if the AUT url was top
        expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
          key: 'cookie2',
          value: 'value2',
          sameSite: 'lax',
        }), 'https://app.foobar.com/test-request', 'strict')

        // should work as this would be set in the browser if the AUT url was top, just sets a third party cookie
        expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
          key: 'cookie3',
          value: 'value3',
          sameSite: 'none',
        }), 'https://app.foobar.com/test-request', 'strict')

        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })

      it('sets first-party cookie context in the jar when simulating top if credentials true with xhr', async function () {
        const appendStub = sinon.stub()

        const cookieJar = {
          getAllCookies: () => [{ key: 'cookie', value: 'value' }],
          setCookie: sinon.stub(),
        }

        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a same-site request that has the ability to set first-party cookies in the browser
            requestedWith: 'xhr',
            credentialsLevel: true,
            proxiedUrl: 'https://app.foobar.com/test-request',
          },
          incomingRes: {
            headers: {
              'set-cookie': ['cookie1=value1; SameSite=Strict', 'cookie2=value2; SameSite=Lax', 'cookie3=value3; SameSite=None; Secure'],
            },
          },
        })

        // a case where top would need to be simulated
        ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
        ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

        await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

        // should work as this would be set in the browser if the AUT url was top
        expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
          key: 'cookie1',
          value: 'value1',
          sameSite: 'strict',
        }), 'https://app.foobar.com/test-request', 'strict')

        // should work as this would be set in the browser if the AUT url was top
        expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
          key: 'cookie2',
          value: 'value2',
          sameSite: 'lax',
        }), 'https://app.foobar.com/test-request', 'strict')

        // should work as this would be set in the browser if the AUT url was top, just sets a third party cookie
        expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
          key: 'cookie3',
          value: 'value3',
          sameSite: 'none',
        }), 'https://app.foobar.com/test-request', 'strict')

        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })

      ;['same-origin', 'omit'].forEach((credentialLevel) => {
        it(`sets no cookies if fetch level is ${credentialLevel}`, async function () {
          const appendStub = sinon.stub()

          const cookieJar = {
            getAllCookies: () => [{ key: 'cookie', value: 'value' }],
            setCookie: sinon.stub(),
          }

          const ctx = prepareContext({
            cookieJar,
            res: {
              append: appendStub,
            },
            req: {
              // a same-site request that has the ability to set first-party cookies in the browser
              requestedWith: 'fetch',
              credentialsLevel: credentialLevel,
              proxiedUrl: 'https://app.foobar.com/test-request',
            },
            incomingRes: {
              headers: {
                'set-cookie': ['cookie1=value1; SameSite=Strict', 'cookie2=value2; SameSite=Lax', 'cookie3=value3; SameSite=None; Secure'],
              },
            },
          })

          // a case where top would need to be simulated
          ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
          ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

          await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

          // should not work as this wouldn't be set in the browser if the AUT url was top
          expect(cookieJar.setCookie).not.to.have.been.called

          // return these to the browser, even though they are likely to fail setting anyway
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
        })
      })
    })

    describe('cross-site', () => {
      it('sets third-party cookie context in the jar when simulating top if credentials included with fetch', async function () {
        const appendStub = sinon.stub()

        const cookieJar = {
          getAllCookies: () => [{ key: 'cookie', value: 'value' }],
          setCookie: sinon.stub(),
        }

        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a cross-site request that has the ability to set cookies in the browser
            requestedWith: 'fetch',
            credentialsLevel: 'include',
            proxiedUrl: 'https://www.barbaz.com/test-request',
          },
          incomingRes: {
            headers: {
              'set-cookie': ['cookie1=value1; SameSite=Strict', 'cookie2=value2; SameSite=Lax', 'cookie3=value3; SameSite=None; Secure'],
            },
          },
        })

        // a case where top would need to be simulated
        ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
        ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

        await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

        // should not work as this wouldn't be set in the browser if the AUT url was top anyway
        expect(cookieJar.setCookie).not.to.have.been.calledWith(sinon.match({
          key: 'cookie1',
          value: 'value1',
          sameSite: 'strict',
        }), 'https://www.barbaz.com/test-request', 'none')

        // should not work as this wouldn't be set in the browser if the AUT url was top anyway
        expect(cookieJar.setCookie).not.to.have.been.calledWith(sinon.match({
          key: 'cookie2',
          value: 'value2',
          sameSite: 'lax',
        }), 'https://www.barbaz.com/test-request', 'none')

        expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
          key: 'cookie3',
          value: 'value3',
          sameSite: 'none',
        }), 'https://www.barbaz.com/test-request', 'none')

        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })

      ;['same-origin', 'omit'].forEach((credentialLevel) => {
        it(`does NOT set third-party cookie context in the jar when simulating top if credentials ${credentialLevel} with fetch`, async function () {
          const appendStub = sinon.stub()

          const cookieJar = {
            getAllCookies: () => [{ key: 'cookie', value: 'value' }],
            setCookie: sinon.stub(),
          }

          const ctx = prepareContext({
            cookieJar,
            res: {
              append: appendStub,
            },
            req: {
              // a cross-site request that has the ability to set cookies in the browser
              requestedWith: 'fetch',
              credentialsLevel: credentialLevel,
              proxiedUrl: 'https://www.barbaz.com/test-request',
            },
            incomingRes: {
              headers: {
                'set-cookie': ['cookie1=value1; SameSite=Strict', 'cookie2=value2; SameSite=Lax', 'cookie3=value3; SameSite=None; Secure'],
              },
            },
          })

          // a case where top would need to be simulated
          ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
          ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

          await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

          expect(cookieJar.setCookie).not.to.have.been.called

          // send to browser anyway even though these will likely fail to be set
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
        })
      })

      it('sets third-party cookie context in the jar when simulating top if withCredentials true with xhr', async function () {
        const appendStub = sinon.stub()

        const cookieJar = {
          getAllCookies: () => [{ key: 'cookie', value: 'value' }],
          setCookie: sinon.stub(),
        }

        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a cross-site request that has the ability to set cookies in the browser
            requestedWith: 'xhr',
            credentialsLevel: true,
            proxiedUrl: 'https://www.barbaz.com/test-request',
          },
          incomingRes: {
            headers: {
              'set-cookie': ['cookie1=value1; SameSite=Strict', 'cookie2=value2; SameSite=Lax', 'cookie3=value3; SameSite=None; Secure'],
            },
          },
        })

        // a case where top would need to be simulated
        ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
        ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

        await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

        // should not work as this wouldn't be set in the browser if the AUT url was top anyway
        expect(cookieJar.setCookie).not.to.have.been.calledWith(sinon.match({
          key: 'cookie1',
          value: 'value1',
          sameSite: 'strict',
        }), 'https://www.barbaz.com/test-request', 'none')

        // should not work as this wouldn't be set in the browser if the AUT url was top anyway
        expect(cookieJar.setCookie).not.to.have.been.calledWith(sinon.match({
          key: 'cookie2',
          value: 'value2',
          sameSite: 'lax',
        }), 'https://www.barbaz.com/test-request', 'none')

        expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
          key: 'cookie3',
          value: 'value3',
          sameSite: 'none',
        }), 'https://www.barbaz.com/test-request', 'none')

        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })

      it('does not set third-party cookie context in the jar when simulating top if withCredentials false with xhr', async function () {
        const appendStub = sinon.stub()

        const cookieJar = {
          getAllCookies: () => [{ key: 'cookie', value: 'value' }],
          setCookie: sinon.stub(),
        }

        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a cross-site request that has the ability to set cookies in the browser
            requestedWith: 'xhr',
            credentialsLevel: false,
            proxiedUrl: 'https://www.barbaz.com/test-request',
          },
          incomingRes: {
            headers: {
              'set-cookie': ['cookie1=value1; SameSite=Strict', 'cookie2=value2; SameSite=Lax', 'cookie3=value3; SameSite=None; Secure'],
            },
          },
        })

        // a case where top would need to be simulated
        ctx.getAUTUrl = () => 'http://www.foobar.com/index.html'
        ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

        await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

        expect(cookieJar.setCookie).not.to.have.been.called

        // send to the browser, even though the browser will NOT set this cookie
        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })
    })

    it(`does NOT set third-party cookie context in the jar if secure cookie is not enabled`, async function () {
      const appendStub = sinon.stub()

      const cookieJar = {
        getAllCookies: () => [{ key: 'cookie', value: 'value' }],
        setCookie: sinon.stub(),
      }

      const ctx = prepareContext({
        cookieJar,
        res: {
          append: appendStub,
        },
        req: {
          // a cross-site request that has the ability to set cookies in the browser
          requestedWith: 'xhr',
          credentialsLevel: true,
          proxiedUrl: 'https://www.barbaz.com/test-request',
        },
        incomingRes: {
          headers: {
            'set-cookie': ['cookie3=value3; SameSite=None'],
          },
        },
      })

      // a case where top would need to be simulated
      ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
      ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(cookieJar.setCookie).not.to.have.been.called

      // send to browser anyway even though these will likely fail to be set
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None')
    })

    it(`allows setting cookies if request type cannot be determined, but comes from the AUT frame (likely in the case of documents or redirects)`, async function () {
      const appendStub = sinon.stub()

      const cookieJar = {
        getAllCookies: () => [{ key: 'cookie', value: 'value' }],
        setCookie: sinon.stub(),
      }

      const ctx = prepareContext({
        cookieJar,
        res: {
          append: appendStub,
        },
        req: {
          isAUTFrame: true,
          proxiedUrl: 'https://www.barbaz.com/index.html',
        },
        incomingRes: {
          headers: {
            'set-cookie': ['cookie=value'],
          },
        },
      })

      // a case where top would need to be simulated
      ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
      ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(cookieJar.setCookie).to.have.been.calledWith(sinon.match({
        key: 'cookie',
        value: 'value',
        sameSite: 'lax',
      }), 'https://www.barbaz.com/index.html', 'lax')

      // send to browser anyway even though these will likely fail to be set
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
    })

    it(`otherwise, does not allow setting cookies if request type cannot be determined and is not from the AUT and is cross-origin`, async function () {
      const appendStub = sinon.stub()

      const cookieJar = {
        getAllCookies: () => [{ key: 'cookie', value: 'value' }],
        setCookie: sinon.stub(),
      }

      const ctx = prepareContext({
        cookieJar,
        res: {
          append: appendStub,
        },
        req: {
          proxiedUrl: 'https://www.barbaz.com/some-image.png',
        },
        incomingRes: {
          headers: {
            'set-cookie': ['cookie=value'],
          },
        },
      })

      // a case where top would need to be simulated
      ctx.getAUTUrl = () => 'https://www.foobar.com/index.html'
      ctx.remoteStates.isPrimarySuperDomainOrigin = () => false

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(cookieJar.setCookie).not.to.have.been.called

      // send to browser anyway even though these will likely fail to be set
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
    })

    it('does not send cross:origin:automation:cookies if request does not need top simulation', async () => {
      const { ctx } = prepareSameOriginContext()

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(ctx.serverBus.emit).not.to.be.called
    })

    it('does not send cross:origin:automation:cookies if there are no added cookies', async () => {
      const cookieJar = {
        getAllCookies: () => [{ key: 'cookie', value: 'value' }],
      }

      const ctx = prepareContext({
        cookieJar,
        incomingRes: {
          headers: {
            'set-cookie': 'cookie=value',
          },
        },
      })

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(ctx.serverBus.emit).not.to.be.called
    })

    it('sends cross:origin:automation:cookies if there are added cookies and resolves on cross:origin:automation:cookies:received', async () => {
      const cookieJar = {
        getAllCookies: sinon.stub(),
      }

      cookieJar.getAllCookies.onCall(0).returns([])
      cookieJar.getAllCookies.onCall(1).returns([cookieStub({ key: 'cookie', value: 'value' })])

      const ctx = prepareContext({
        cookieJar,
        incomingRes: {
          headers: {
            'set-cookie': 'cookie=value',
          },
        },
      })

      // test will hang if this.next() is not called, so this also tests
      // that we move on once receiving this event
      ctx.serverBus.once.withArgs('cross:origin:automation:cookies:received').yields()

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(ctx.serverBus.emit).to.be.calledWith('cross:origin:automation:cookies')

      const cookies = ctx.serverBus.emit.withArgs('cross:origin:automation:cookies').args[0][1]

      expect(cookies[0].name).to.equal('cookie')
      expect(cookies[0].value).to.equal('value')
    })

    function prepareContext (props) {
      const remoteStates = new RemoteStates(() => {})

      // set the primary remote state
      remoteStates.set('http://foobar.com')

      // set the secondary remote states
      props.secondaryOrigins?.forEach((origin) => {
        remoteStates.set(origin, {}, false)
      })

      remoteStates.isPrimarySuperDomainOrigin = () => false

      const cookieJar = props.cookieJar || {
        getAllCookies: () => [],
      }

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
          proxiedUrl: 'http://www.foobar.com/login',
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
        getCookieJar: () => cookieJar,
        getAUTUrl: () => 'http://www.foobar.com/primary-origin.html',
        remoteStates,
        debug () {},
        onError (error) {
          throw error
        },
        serverBus: {
          emit: sinon.stub(),
          once: sinon.stub(),
        },
        ..._.omit(props, 'incomingRes', 'res', 'req'),
      }
    }

    function prepareSameOriginContext (props = {}) {
      const appendStub = sinon.stub()

      const ctx = prepareContext({
        req: {
          isAUTFrame: true,
          ...props.req,
        },
        incomingRes: {
          headers: {
            'set-cookie': 'cookie=value',
          },
          ...props.incomingRes,
        },
        res: {
          append: appendStub,
          ...props.res,
        },
      })

      ctx.remoteStates.isPrimarySuperDomainOrigin = () => true

      return { appendStub, ctx }
    }

    function cookieStub (props) {
      return {
        expiryTime: () => 0,
        ...props,
      }
    }
  })

  describe('MaybeInjectHtml', function () {
    const { MaybeInjectHtml } = ResponseMiddleware
    let ctx
    let htmlStub

    beforeEach(() => {
      htmlStub = sinon.spy(rewriter, 'html')
    })

    afterEach(() => {
      htmlStub.restore()
    })

    it('modifyObstructiveThirdPartyCode is true for secondary requests', function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://www.foobar.com:3501/primary-origin.html',
        },
      })

      return testMiddleware([MaybeInjectHtml], ctx)
      .then(() => {
        expect(htmlStub).to.be.calledOnce
        expect(htmlStub).to.be.calledWith('foo', {
          'deferSourceMapRewrite': undefined,
          'domainName': 'foobar.com',
          'isHtml': true,
          'modifyObstructiveCode': true,
          'modifyObstructiveThirdPartyCode': true,
          'url': 'http://www.foobar.com:3501/primary-origin.html',
          'useAstSourceRewriting': undefined,
          'wantsInjection': 'full',
          'wantsSecurityRemoved': true,
        })
      })
    })

    it('modifyObstructiveThirdPartyCode is false for primary requests', function () {
      prepareContext({})

      return testMiddleware([MaybeInjectHtml], ctx)
      .then(() => {
        expect(htmlStub).to.be.calledOnce
        expect(htmlStub).to.be.calledWith('foo', {
          'deferSourceMapRewrite': undefined,
          'domainName': '127.0.0.1',
          'isHtml': true,
          'modifyObstructiveCode': true,
          'modifyObstructiveThirdPartyCode': false,
          'url': 'http://127.0.0.1:3501/primary-origin.html',
          'useAstSourceRewriting': undefined,
          'wantsInjection': 'full',
          'wantsSecurityRemoved': true,
        })
      })
    })

    it('modifyObstructiveThirdPartyCode is false when experimental flag is false', function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://www.foobar.com:3501/primary-origin.html',
        },
        config: {
          modifyObstructiveCode: false,
          experimentalModifyObstructiveThirdPartyCode: false,
        },
      })

      return testMiddleware([MaybeInjectHtml], ctx)
      .then(() => {
        expect(htmlStub).to.be.calledOnce
        expect(htmlStub).to.be.calledWith('foo', {
          'deferSourceMapRewrite': undefined,
          'domainName': 'foobar.com',
          'isHtml': true,
          'modifyObstructiveCode': false,
          'modifyObstructiveThirdPartyCode': false,
          'url': 'http://www.foobar.com:3501/primary-origin.html',
          'useAstSourceRewriting': undefined,
          'wantsInjection': 'full',
          'wantsSecurityRemoved': true,
        })
      })
    })

    function prepareContext (props) {
      const remoteStates = new RemoteStates(() => {})
      const stream = Readable.from(['foo'])

      // set the primary remote state
      remoteStates.set('http://127.0.0.1:3501')

      ctx = {
        incomingRes: {
          headers: {},
          ...props.incomingRes,
        },
        res: {
          wantsInjection: 'full',
          wantsSecurityRemoved: true,
          ...props.res,
        },
        req: {
          proxiedUrl: 'http://127.0.0.1:3501/primary-origin.html',
          ...props.req,
        },
        makeResStreamPlainText () {},
        incomingResStream: stream,
        config: {
          modifyObstructiveCode: true,
          experimentalModifyObstructiveThirdPartyCode: true,
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

  describe('MaybeRemoveSecurity', function () {
    const { MaybeRemoveSecurity } = ResponseMiddleware
    let ctx
    let securityStub

    beforeEach(() => {
      securityStub = sinon.spy(rewriter, 'security')
    })

    afterEach(() => {
      securityStub.restore()
    })

    it('modifyObstructiveThirdPartyCode is true for secondary requests', function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://www.foobar.com:3501/primary-origin.html',
        },
      })

      return testMiddleware([MaybeRemoveSecurity], ctx)
      .then(() => {
        expect(securityStub).to.be.calledOnce
        expect(securityStub).to.be.calledWith({
          'deferSourceMapRewrite': undefined,
          'isHtml': true,
          'modifyObstructiveCode': true,
          'modifyObstructiveThirdPartyCode': true,
          'url': 'http://www.foobar.com:3501/primary-origin.html',
          'useAstSourceRewriting': undefined,
        })
      })
    })

    it('modifyObstructiveThirdPartyCode is false for primary requests', function () {
      prepareContext({})

      return testMiddleware([MaybeRemoveSecurity], ctx)
      .then(() => {
        expect(securityStub).to.be.calledOnce
        expect(securityStub).to.be.calledWith({
          'deferSourceMapRewrite': undefined,
          'isHtml': true,
          'modifyObstructiveCode': true,
          'modifyObstructiveThirdPartyCode': false,
          'url': 'http://127.0.0.1:3501/primary-origin.html',
          'useAstSourceRewriting': undefined,
        })
      })
    })

    it('modifyObstructiveThirdPartyCode is false when experimental flag is false', function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://www.foobar.com:3501/primary-origin.html',
        },
        config: {
          modifyObstructiveCode: false,
          experimentalModifyObstructiveThirdPartyCode: false,
        },
      })

      return testMiddleware([MaybeRemoveSecurity], ctx)
      .then(() => {
        expect(securityStub).to.be.calledOnce
        expect(securityStub).to.be.calledWith({
          'deferSourceMapRewrite': undefined,
          'isHtml': true,
          'modifyObstructiveCode': false,
          'modifyObstructiveThirdPartyCode': false,
          'url': 'http://www.foobar.com:3501/primary-origin.html',
          'useAstSourceRewriting': undefined,
        })
      })
    })

    function prepareContext (props) {
      const remoteStates = new RemoteStates(() => {})
      const stream = Readable.from(['foo'])

      // set the primary remote state
      remoteStates.set('http://127.0.0.1:3501')

      ctx = {
        incomingRes: {
          headers: {},
          ...props.incomingRes,
        },
        res: {
          wantsInjection: 'full',
          wantsSecurityRemoved: true,
          ...props.res,
        },
        req: {
          proxiedUrl: 'http://127.0.0.1:3501/primary-origin.html',
          ...props.req,
        },
        makeResStreamPlainText () {},
        incomingResStream: stream,
        config: {
          modifyObstructiveCode: true,
          experimentalModifyObstructiveThirdPartyCode: true,
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
})
