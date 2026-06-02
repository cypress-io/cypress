import { describe, expect, beforeEach, afterEach, it, vi, Mock, MockInstance } from 'vitest'
import _ from 'lodash'
import zlib from 'zlib'
import ResponseMiddleware from '../../../lib/http/response-middleware'
import { debugVerbose } from '../../../lib/http'
import EventEmitter from 'events'
import { testMiddleware } from './helpers'
import { RemoteStates, DocumentDomainInjection } from '@packages/network-tools'
import { Readable } from 'stream'
import * as rewriter from '../../../lib/http/util/rewriter'
import { nonceDirectives, problematicCspDirectives, unsupportedCSPDirectives } from '../../../lib/http/util/csp-header'
import * as serviceWorkerInjector from '../../../lib/http/util/service-worker-injector'

async function flushPromises () {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('http/response-middleware', function () {
  const serverPort = 3030
  const fileServerPort = 3030

  const remoteStateConfig = () => {
    return { server: serverPort, fileServer: fileServerPort }
  }

  let remoteStates: RemoteStates
  let documentDomainInjection: DocumentDomainInjection

  beforeEach(() => {
    documentDomainInjection = DocumentDomainInjection.InjectionBehavior({ injectDocumentDomain: false, testingType: 'e2e' })
    remoteStates = new RemoteStates(remoteStateConfig, documentDomainInjection)
  })

  it('exports the members in the correct order', function () {
    expect(_.keys(ResponseMiddleware)).toEqual([
      'LogResponse',
      'FilterNonProxiedResponse',
      'AttachPlainTextStreamFn',
      'InterceptResponse',
      'PatchExpressSetHeader',
      'OmitProblematicHeaders',
      'MaybeSetOriginAgentClusterHeader',
      'SetInjectionLevel',
      'MaybePreventCaching',
      'MaybeStripDocumentDomainFeaturePolicy',
      'MaybeCopyCookiesFromIncomingRes',
      'MaybeSendRedirectToClient',
      'CopyResponseStatusCode',
      'ClearCyInitialCookie',
      'MaybeEndWithEmptyBody',
      'MaybeInjectHtml',
      'MaybeRemoveSecurity',
      'MaybeInjectServiceWorker',
      'CompressBody',
      'SendResponseBodyToClient',
    ])
  })

  describe('multiple this.next invocations', () => {
    describe('within the same middleware', () => {
      it('throws an error', function () {
        const middleware = function () {
          this.next()
          this.next()
        }

        return new Promise<void>((resolve) => {
          testMiddleware([middleware], {
            res: {
              on: (event, listener) => {},
              off: (event, listener) => {},
            },
            onError (err) {
              expect(err.message).toEqual('Internal error while proxying "undefined undefined" in 0:\nError running proxy middleware: Detected `this.next()` was called more than once in the same middleware function, but a middleware can only be completed once.')

              resolve()
            },
          })
        })
      })

      it('includes a previous context error in error message if one exists', () => {
        const middleware = function () {
          this.next()
          this.next()
        }
        const error = new Error('previous error')

        return new Promise<void>((resolve) => {
          testMiddleware([middleware], {
            error,
            res: {
              on: (event, listener) => {},
              off: (event, listener) => {},
            },
            onError (err) {
              expect(err.message).toContain('This middleware invocation previously encountered an error which may be related, see `error.cause`')
              expect(err['cause']).toEqual(error)
              resolve()
            },
            method: 'GET',
            proxiedUrl: 'url',
          })
        })
      })
    })

    describe('across different middleware', () => {
      it('does not throw an error', function () {
        const middleware1 = function () {
          this.next()
        }
        const middleware2 = function () {
          this.next()
        }

        return testMiddleware([middleware1, middleware2], {
          res: {
            on: (event, listener) => {},
            off: (event, listener) => {},
          },
          onError () {
            throw new Error('onError should not be called')
          },
        })
      })
    })
  })

  describe('FilterNonProxiedResponse', () => {
    const { FilterNonProxiedResponse } = ResponseMiddleware
    let ctx
    let headers

    beforeEach(() => {
      headers = { 'header-name': 'header-value' }
      ctx = {
        onlyRunMiddleware: vi.fn(),
        incomingRes: { headers },
        req: {},
        res: {
          set: vi.fn(),
          off: (event, listener) => {},
        },
      }
    })

    it('sets headers on response and runs minimal subsequent middleware if request is from an extra target', async () => {
      ctx.req.isFromExtraTarget = true

      await testMiddleware([FilterNonProxiedResponse], ctx)
      expect(ctx.res.set).toHaveBeenCalledWith(headers)

      expect(ctx['onlyRunMiddleware']).toHaveBeenCalledWith([
        'AttachPlainTextStreamFn',
        'PatchExpressSetHeader',
        'MaybeSendRedirectToClient',
        'CopyResponseStatusCode',
        'MaybeEndWithEmptyBody',
        'CompressBody',
        'SendResponseBodyToClient',
      ])
    })

    it('runs all subsequent middleware if request is not from an extra target', async () => {
      ctx.req.isFromMainTarget = false

      await testMiddleware([FilterNonProxiedResponse], ctx)
      expect(ctx['onlyRunMiddleware']).not.toHaveBeenCalled()
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

      it(`doesn't do anything`, async () => {
        await testMiddleware([MaybeStripDocumentDomainFeaturePolicy], ctx)
        expect(ctx.res.set).not.toHaveBeenCalled()
      })
    })

    describe('when no document-domain directive is present', function () {
      beforeEach(function () {
        delete featurePolicyDirectives['document-domain']
        prepareContext()
      })

      it(`doesn't do anything`, async () => {
        await testMiddleware([MaybeStripDocumentDomainFeaturePolicy], ctx)
        expect(ctx.res.set).not.toHaveBeenCalled()
      })
    })

    describe('when both feature-policy header and document-domain directive are present', function () {
      describe('when there are also other directives', function () {
        beforeEach(function () {
          prepareContext()
        })

        it('removes the document-domain directive from the header and keeps the rest', async () => {
          await testMiddleware([MaybeStripDocumentDomainFeaturePolicy], ctx)
          const [, featurePolicy] = ctx.res.set.mock.calls[0]
          const directives = _.fromPairs(featurePolicy.split('; ').map((directive) => directive.split(' ')))

          expect(directives['document-domain']).toBeUndefined()
          expect(directives['autoplay']).toBeDefined()
          expect(directives['camera']).toBeDefined()
        })
      })

      describe('when it is the only directive', function () {
        beforeEach(function () {
          featurePolicyDirectives = _.pick(featurePolicyDirectives, 'document-domain')
          prepareContext()
        })

        it('removes the whole header', async () => {
          await testMiddleware([MaybeStripDocumentDomainFeaturePolicy], ctx)
          expect(ctx.res.removeHeader).toHaveBeenCalledWith('feature-policy')
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
          getHeaders: () => headers,
          set: vi.fn(),
          removeHeader: vi.fn(),
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
        incomingRes: {
          headers,
        },
      }
    }
  })

  describe('OmitProblematicHeaders', function () {
    const { OmitProblematicHeaders } = ResponseMiddleware
    let ctx

    [
      'set-cookie',
      'x-frame-options',
      'content-length',
      'transfer-encoding',
      'connection',
    ].forEach((prop) => {
      it(`always removes "${prop}" from incoming headers`, async function () {
        prepareContext({ [prop]: 'foo' })

        await testMiddleware([OmitProblematicHeaders], ctx)
        expect(ctx.res.set).toHaveBeenCalledWith(expect.not.objectContaining({ [prop]: expect.anything() }))
      })
    })

    it('records incomingResHadEmptyBody=true when origin sent Content-Length: 0', async function () {
      prepareContext({ 'content-length': '0' })

      await testMiddleware([OmitProblematicHeaders], ctx)
      expect(ctx.incomingResHadEmptyBody).toBe(true)
    })

    it('records incomingResHadEmptyBody=false when Content-Length is non-zero', async function () {
      prepareContext({ 'content-length': '42' })

      await testMiddleware([OmitProblematicHeaders], ctx)
      expect(ctx.incomingResHadEmptyBody).toBe(false)
    })

    it('records incomingResHadEmptyBody=false when Content-Length is absent', async function () {
      prepareContext()
      delete ctx.incomingRes.headers['content-length']

      await testMiddleware([OmitProblematicHeaders], ctx)
      expect(ctx.incomingResHadEmptyBody).toBe(false)
    })

    let badHeaders = {
      'bad-header ': 'value', //(contains trailling space)
      'Content Type': 'value', //(contains a space)
      'User-Agent:': 'value', //(contains a colon)
      'Accept-Encoding;': 'value', //(contains a semicolon)
      '@Origin': 'value', //(contains an at symbol)
      'Authorization?': 'value', //(contains a question mark)
      'X-My-Header/Version': 'value', //(contains a slash)
      'Referer[1]': 'value', //(contains square brackets)
      'If-None-Match{1}': 'value', //(contains curly braces)
      'X-Forwarded-For<1>': 'value', //(contains angle brackets)
    }

    it('removes invalid headers and leaves valid headers', async function () {
      prepareContext({ ...badHeaders, 'good-header': 'value' })

      await testMiddleware([OmitProblematicHeaders], ctx)
      expect(ctx.res.set).toHaveBeenCalledOnce()
      expect(ctx.res.set).toHaveBeenCalledWith(expect.not.objectContaining({ ...badHeaders }))
      expect(ctx.res.set).toHaveBeenCalledWith(expect.objectContaining({ 'good-header': 'value' }))
    })

    const validCspHeaderNames = [
      'content-security-policy',
      'Content-Security-Policy',
      'content-security-policy-report-only',
      'Content-Security-Policy-Report-Only',
    ]

    unsupportedCSPDirectives.forEach((directive) => {
      validCspHeaderNames.forEach((headerName) => {
        it(`always removes "${directive}" directive from "${headerName}" headers 'when experimentalCspAllowList is true`, async () => {
          prepareContext({
            [`${headerName}`]: `${directive} 'fake-csp-${directive}-value'; fake-csp-directive fake-csp-value`,
          }, {
            experimentalCspAllowList: true,
          })

          await testMiddleware([OmitProblematicHeaders], ctx)
          expect(ctx.res.setHeader).toHaveBeenCalledWith(headerName.toLowerCase(), [
            'fake-csp-directive fake-csp-value',
          ])
        })

        it(`always removes "${directive}" from "${headerName}" headers when experimentalCspAllowList is an empty array`, async () => {
          prepareContext({
            [`${headerName}`]: `${directive} 'fake-csp-${directive}-value'; fake-csp-directive fake-csp-value`,
          }, {
            experimentalCspAllowList: [],
          })

          await testMiddleware([OmitProblematicHeaders], ctx)
          expect(ctx.res.setHeader).toHaveBeenCalledWith(headerName.toLowerCase(), [
            'fake-csp-directive fake-csp-value',
          ])
        })

        it(`always removes "${directive}" from "${headerName}" headers when experimentalCspAllowList is an array including "${directive}"`, async () => {
          prepareContext({
            [`${headerName}`]: `${directive} 'fake-csp-${directive}-value'; fake-csp-directive fake-csp-value`,
          }, {
            experimentalCspAllowList: [`${directive}`],
          })

          await testMiddleware([OmitProblematicHeaders], ctx)
          expect(ctx.res.setHeader).toHaveBeenCalledWith(headerName.toLowerCase(), [
            'fake-csp-directive fake-csp-value',
          ])
        })
      })
    })

    validCspHeaderNames.forEach((headerName) => {
      it(`removes "${headerName}" headers when experimentalCspAllowList is false`, async () => {
        prepareContext({
          [`${headerName}`]: `fake-csp-directive fake-csp-value`,
        }, {
          experimentalCspAllowList: false,
        })

        await testMiddleware([OmitProblematicHeaders], ctx)
        expect(ctx.res.removeHeader).toHaveBeenCalledWith(headerName.toLowerCase())
      })
    })

    validCspHeaderNames.forEach((headerName) => {
      it(`will not remove invalid problematicCspDirectives directives provided from "${headerName}" headers when experimentalCspAllowList is an array of directives`, async () => {
        prepareContext({
          [`${headerName}`]: `fake-csp-directive-0 fake-csp-value-0; fake-csp-directive-1 fake-csp-value-1; fake-csp-directive-2 fake-csp-value-2`,
        }, {
          experimentalCspAllowList: ['fake-csp-directive-1'],
        })

        await testMiddleware([OmitProblematicHeaders], ctx)
        expect(ctx.res.setHeader).toHaveBeenCalledWith(headerName.toLowerCase(), [
          'fake-csp-directive-0 fake-csp-value-0; fake-csp-directive-1 fake-csp-value-1; fake-csp-directive-2 fake-csp-value-2',
        ])
      })
    })

    validCspHeaderNames.forEach((headerName) => {
      problematicCspDirectives.forEach((directive) => {
        it(`will allow problematicCspDirectives provided from "${headerName}" headers when experimentalCspAllowList is an array including "${directive}"`, async () => {
          prepareContext({
            [`${headerName}`]: `fake-csp-directive fake-csp-value; ${directive} fake-csp-${directive}-value`,
          }, {
            experimentalCspAllowList: [directive],
          })

          await testMiddleware([OmitProblematicHeaders], ctx)
          expect(ctx.res.setHeader).toHaveBeenCalledWith(headerName.toLowerCase(), [
            `fake-csp-directive fake-csp-value; ${directive} fake-csp-${directive}-value`,
          ])
        })

        problematicCspDirectives.forEach((otherDirective) => {
          if (directive === otherDirective) return

          it(`will still remove other problematicCspDirectives provided from "${headerName}" headers when experimentalCspAllowList is an array including singe directives "${directive}"`, async () => {
            prepareContext({
              [`${headerName}`]: `${directive} fake-csp-${directive}-value; fake-csp-directive fake-csp-value; ${otherDirective} fake-csp-${otherDirective}-value`,
            }, {
              experimentalCspAllowList: [directive],
            })

            await testMiddleware([OmitProblematicHeaders], ctx)
            expect(ctx.res.setHeader).toHaveBeenCalledWith(headerName.toLowerCase(), [
                `${directive} fake-csp-${directive}-value; fake-csp-directive fake-csp-value`,
            ])
          })

          it(`will allow both problematicCspDirectives provided from "${headerName}" headers when experimentalCspAllowList is an array including multiple directives ["${directive}","${otherDirective}"]`, async () => {
            prepareContext({
              [`${headerName}`]: `${directive} fake-csp-${directive}-value; fake-csp-directive fake-csp-value; ${otherDirective} fake-csp-${otherDirective}-value`,
            }, {
              experimentalCspAllowList: [directive, otherDirective],
            })

            await testMiddleware([OmitProblematicHeaders], ctx)
            expect(ctx.res.setHeader).toHaveBeenCalledWith(headerName.toLowerCase(), [
                `${directive} fake-csp-${directive}-value; fake-csp-directive fake-csp-value; ${otherDirective} fake-csp-${otherDirective}-value`,
            ])
          })
        })
      })
    })

    function prepareContext (additionalHeaders = {}, config = {}) {
      const headers = {
        'content-type': 'text/html',
        'content-length': '123',
        'content-encoding': 'gzip',
        'transfer-encoding': 'chunked',
        'set-cookie': 'foo=bar',
        'x-frame-options': 'DENY',
        'connection': 'keep-alive',
      }

      ctx = {
        config: {
          experimentalCspAllowList: false,
          ...config,
        },
        incomingRes: {
          headers: {
            ...headers,
            ...additionalHeaders,
          },
        },
        res: {
          removeHeader: vi.fn(),
          set: vi.fn(),
          setHeader: vi.fn(),
          on: (event, listener) => {},
          off: (event, listener) => {},
          getHeaderNames: () => Object.keys(ctx.incomingRes.headers),
        },
      }
    }
  })

  describe('MaybeSetOriginAgentClusterHeader', function () {
    const { MaybeSetOriginAgentClusterHeader } = ResponseMiddleware
    let ctx

    beforeEach(function () {
      vi.unstubAllEnvs()
      ctx = {
        req: {
          proxiedUrl: 'http://localhost:4455',
        },
        res: {
          setHeader: vi.fn(),
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }
    })

    it('doesn\'t set the Origin-Agent-Cluster for the request if cypress-in-cypress testing is off', async function () {
      vi.stubEnv('CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT', undefined)

      await testMiddleware([MaybeSetOriginAgentClusterHeader], ctx)
      expect(ctx.res.setHeader).not.toHaveBeenCalled()
    })

    it('doesn\'t set the Origin-Agent-Cluster for the request if cypress-in-cypress testing is on but url does NOT match http proxy', async function () {
      vi.stubEnv('CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT', '1')
      vi.stubEnv('HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS', 'http://localhost:4456')

      await testMiddleware([MaybeSetOriginAgentClusterHeader], ctx)
      expect(ctx.res.setHeader).not.toHaveBeenCalled()
    })

    it('sets the Origin-Agent-Cluster for the request if cypress-in-cypress testing is on and url matches http proxy', async function () {
      vi.stubEnv('CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT', '1')
      vi.stubEnv('HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS', 'http://localhost:4455')

      await testMiddleware([MaybeSetOriginAgentClusterHeader], ctx)
      expect(ctx.res.setHeader).toHaveBeenCalledWith('Origin-Agent-Cluster', '?0')
    })
  })

  describe('SetInjectionLevel', function () {
    const { SetInjectionLevel } = ResponseMiddleware
    let ctx

    it('doesn\'t inject anything when not html', async function () {
      prepareContext({
        req: {
          cookies: {},
          headers: {},
        },
      })

      await testMiddleware([SetInjectionLevel], ctx)
      expect(ctx.res.wantsInjection).toBe(false)
    })

    it('doesn\'t inject anything when not rendered html', async function () {
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

      await testMiddleware([SetInjectionLevel], ctx)
      expect(ctx.res.wantsInjection).toBe(false)
    })

    it('doesn\'t inject anything when not AUT frame', async function () {
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

      await testMiddleware([SetInjectionLevel], ctx)
      expect(ctx.res.wantsInjection).toBe(false)
    })

    it('injects "fullCrossOrigin" when request is cross-origin html', async function () {
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
      })

      await testMiddleware([SetInjectionLevel], ctx)
      expect(ctx.res.wantsInjection).toEqual('fullCrossOrigin')
    })

    it('performs full injection on initial AUT html origin', async function () {
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

      await testMiddleware([SetInjectionLevel], ctx)
      expect(ctx.res.wantsInjection).toEqual('full')
    })

    it('otherwise, partial injection is set', async function () {
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
      })

      await testMiddleware([SetInjectionLevel], ctx)
      expect(ctx.res.wantsInjection).toEqual('partial')
    })

    it('injects partial when request is for top-level origin', async function () {
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
      })

      await testMiddleware([SetInjectionLevel], ctx)
      expect(ctx.res.wantsInjection).toEqual('partial')
    })

    it('does not set Origin-Agent-Cluster header to false when injection is not expected', async function () {
      prepareContext({})

      await testMiddleware([SetInjectionLevel], ctx)
      expect(ctx.res.setHeader).not.toHaveBeenCalledWith('Origin-Agent-Cluster', '?0')
    })

    it('sets Origin-Agent-Cluster header to false when injection is expected', async function () {
      prepareContext({
        incomingRes: {
          headers: {
            // simplest way to make injection expected
            'x-cypress-file-server-error': true,
          },
        },
      })

      await testMiddleware([SetInjectionLevel], ctx)
      expect(ctx.res.setHeader).toHaveBeenCalledWith('Origin-Agent-Cluster', '?0')
    })

    describe('CSP header nonce injection', () => {
      // Loop through valid CSP header names to verify that we handle them
      [
        'content-security-policy',
        'Content-Security-Policy',
        'content-security-policy-report-only',
        'Content-Security-Policy-Report-Only',
      ].forEach((headerName) => {
        describe(`${headerName}`, () => {
          nonceDirectives.forEach((validNonceDirectiveName) => {
            it(`modifies existing "${validNonceDirectiveName}" directive for "${headerName}" header if injection is requested, header exists, and "${validNonceDirectiveName}" directive exists`, async function () {
              prepareContext({
                res: {
                  getHeaders () {
                    return {
                      [`${headerName}`]: `fake-csp-directive fake-csp-value; ${validNonceDirectiveName} \'fake-src\'`,
                    }
                  },
                  wantsInjection: 'full',
                },
              })

              await testMiddleware([SetInjectionLevel], ctx)
              expect(ctx.res.setHeader).toHaveBeenCalledWith(
                headerName.toLowerCase(),
                expect.arrayContaining([
                  expect.stringMatching(
                    new RegExp(`^fake-csp-directive fake-csp-value; ${validNonceDirectiveName} 'fake-src' 'nonce-([A-Za-z0-9+/=]+|=[^=]|={3,})'$`),
                  ),
                ]),
              )
            })

            it(`modifies all existing "${validNonceDirectiveName}" directives for "${headerName}" header if injection is requested, and multiple headers exist with "${validNonceDirectiveName}" directives`, async function () {
              prepareContext({
                res: {
                  getHeaders () {
                    return {
                      [`${headerName}`]: `fake-csp-directive-0 fake-csp-value-0; ${validNonceDirectiveName} \'fake-src-0\',${validNonceDirectiveName} \'fake-src-1\'`,
                    }
                  },
                  wantsInjection: 'full',
                },
              })

              await testMiddleware([SetInjectionLevel], ctx)

              expect(ctx.res.setHeader).toHaveBeenCalledWith(
                headerName.toLowerCase(),
                expect.arrayContaining([
                  expect.stringMatching(
                    new RegExp(`^fake-csp-directive-0 fake-csp-value-0; ${validNonceDirectiveName} 'fake-src-0' 'nonce-([A-Za-z0-9+/=]+|=[^=]|={3,})'$`),
                  ),
                  expect.stringMatching(
                    new RegExp(`^${validNonceDirectiveName} 'fake-src-1' 'nonce-([A-Za-z0-9+/=]+|=[^=]|={3,})'$`),
                  ),
                ]),
              )
            })

            it(`does not modify existing "${validNonceDirectiveName}" directive for "${headerName}" header if injection is not requested`, async () => {
              prepareContext({
                res: {
                  getHeaders () {
                    return {
                      [`${headerName}`]: `fake-csp-directive fake-csp-value; ${validNonceDirectiveName} \'fake-src\'`,
                    }
                  },
                  wantsInjection: false,
                },
              })

              await testMiddleware([SetInjectionLevel], ctx)
              expect(ctx.res.setHeader).not.toHaveBeenCalledWith(headerName, expect.any(Array))
              expect(ctx.res.setHeader).not.toHaveBeenCalledWith(headerName.toLowerCase(), expect.any(Array))
            })

            it(`does not modify existing "${validNonceDirectiveName}" directive for non-csp headers`, async () => {
              const nonCspHeader = 'Non-Csp-Header'

              prepareContext({
                res: {
                  getHeaders () {
                    return {
                      [`${nonCspHeader}`]: `${validNonceDirectiveName} \'fake-src\'`,
                    }
                  },
                  wantsInjection: 'full',
                },
              })

              await testMiddleware([SetInjectionLevel], ctx)
              expect(ctx.res.setHeader).not.toHaveBeenCalledWith(nonCspHeader, expect.any(Array))
              expect(ctx.res.setHeader).not.toHaveBeenCalledWith(nonCspHeader.toLowerCase(), expect.any(Array))
            })

            nonceDirectives.filter((directive) => directive !== validNonceDirectiveName).forEach((otherNonceDirective) => {
              it(`modifies existing "${otherNonceDirective}" directive for "${headerName}" header if injection is requested, header exists, and "${validNonceDirectiveName}" directive exists`, async () => {
                prepareContext({
                  res: {
                    getHeaders () {
                      return {
                        [`${headerName}`]: `${validNonceDirectiveName} \'self\'; fake-csp-directive fake-csp-value; ${otherNonceDirective} \'fake-src\'`,
                      }
                    },
                    wantsInjection: 'full',
                  },
                })

                await testMiddleware([SetInjectionLevel], ctx)
                expect(ctx.res.setHeader).toHaveBeenCalledWith(
                  headerName.toLowerCase(),
                  expect.arrayContaining([
                    expect.stringMatching(
                      new RegExp(`^${validNonceDirectiveName} 'self' 'nonce-([A-Za-z0-9+/=]+|=[^=]|={3,})'; fake-csp-directive fake-csp-value; ${otherNonceDirective} 'fake-src' 'nonce-([A-Za-z0-9+/=]+|=[^=]|={3,})'$`),
                    ),
                  ]),
                )
              })

              it(`modifies existing "${otherNonceDirective}" directive for "${headerName}" header if injection is requested, header exists, and "${validNonceDirectiveName}" directive exists in a different header`, async () => {
                prepareContext({
                  res: {
                    getHeaders () {
                      return {
                        [`${headerName}`]: `${validNonceDirectiveName} \'self\',fake-csp-directive fake-csp-value; ${otherNonceDirective} \'fake-src\'`,
                      }
                    },
                    wantsInjection: 'full',
                  },
                })

                await testMiddleware([SetInjectionLevel], ctx)
                expect(ctx.res.setHeader).toHaveBeenCalledWith(
                  headerName.toLowerCase(),
                  expect.arrayContaining([
                    expect.stringMatching(
                      new RegExp(`^${validNonceDirectiveName} 'self' 'nonce-([A-Za-z0-9+/=]+|=[^=]|={3,})'`),
                    ),
                    expect.stringMatching(
                      new RegExp(`^fake-csp-directive fake-csp-value; ${otherNonceDirective} 'fake-src' 'nonce-([A-Za-z0-9+/=]+|=[^=]|={3,})'$`),
                    ),
                  ]),
                )
              })
            })
          })

          it(`does not append script-src directive in "${headerName}" headers if injection is requested, header exists, but no valid directive exists`, async () => {
            prepareContext({
              res: {
                getHeaders () {
                  return {
                    [`${headerName}`]: 'fake-csp-directive fake-csp-value;',
                  }
                },
                wantsInjection: 'full',
              },
            })

            await testMiddleware([SetInjectionLevel], ctx)
            // If directive doesn't exist, it shouldn't be updated
            expect(ctx.res.setHeader).not.toHaveBeenCalledWith(headerName, expect.any(Array))
            expect(ctx.res.setHeader).not.toHaveBeenCalledWith(headerName.toLowerCase(), expect.any(Array))
          })

          it(`does not append script-src directive in "${headerName}" headers if injection is requested, and multiple headers exists, but no valid directive exists`, async () => {
            prepareContext({
              res: {
                getHeaders: () => {
                  return {
                    [`${headerName}`]: 'fake-csp-directive-0 fake-csp-value-0,fake-csp-directive-1 fake-csp-value-1',
                  }
                },
                wantsInjection: 'full',
              },
            })

            await testMiddleware([SetInjectionLevel], ctx)
            // If directive doesn't exist, it shouldn't be updated
            expect(ctx.res.setHeader).not.toHaveBeenCalledWith(headerName, expect.any(Array))
            expect(ctx.res.setHeader).not.toHaveBeenCalledWith(headerName.toLowerCase(), expect.any(Array))
          })

          it(`does not modify "${headerName}" header if full injection is requested, and header does not exist`, async () => {
            prepareContext({
              res: {
                getHeaders: () => {
                  return {}
                },
                wantsInjection: 'full',
              },
            })

            await testMiddleware([SetInjectionLevel], ctx)
            expect(ctx.res.setHeader).not.toHaveBeenCalledWith(headerName, expect.any(Array))
            expect(ctx.res.setHeader).not.toHaveBeenCalledWith(headerName.toLowerCase(), expect.any(Array))
          })

          it(`does not modify "${headerName}" header when no injection is requested, and header exists`, async () => {
            prepareContext({
              res: {
                getHeaders: () => {
                  return {
                    [`${headerName}`]: 'fake-csp-directive fake-csp-value',
                  }
                },
                wantsInjection: false,
              },
            })

            await testMiddleware([SetInjectionLevel], ctx)
            expect(ctx.res.setHeader).not.toHaveBeenCalledWith(headerName, expect.any(Array))
            expect(ctx.res.setHeader).not.toHaveBeenCalledWith(headerName.toLowerCase(), expect.any(Array))
          })
        })
      })
    })

    describe('wantsSecurityRemoved', () => {
      it('removes security if full injection is requested', async () => {
        prepareContext({
          res: {
            wantsInjection: 'full',
          },
          config: {
            modifyObstructiveCode: true,
          },
        })

        await testMiddleware([SetInjectionLevel], ctx)
        expect(ctx.res.wantsSecurityRemoved).toBe(true)
      })

      it('removes security if fullCrossOrigin injection is requested', async () => {
        prepareContext({
          res: {
            wantsInjection: 'fullCrossOrigin',
          },
          config: {
            modifyObstructiveCode: true,
          },
        })

        await testMiddleware([SetInjectionLevel], ctx)
        expect(ctx.res.wantsSecurityRemoved).toBe(true)
      })

      const javascriptMIMEs = ['application/javascript', 'application/x-javascript', 'text/javascript']

      javascriptMIMEs.forEach((javascriptMIME) => {
        it(`removes security if the MIME type is ${javascriptMIME} and is on the currently active remote state`, async () => {
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

          await testMiddleware([SetInjectionLevel], ctx)
          expect(ctx.res.wantsSecurityRemoved).toBe(true)
        })
      })

      it('otherwise, does not try to remove security on other MIME Types', async () => {
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

        await testMiddleware([SetInjectionLevel], ctx)
        expect(ctx.res.wantsSecurityRemoved).toBe(false)
      })

      describe('experimentalModifyObstructiveThirdPartyCode', () => {
        it('continues to "modifyObstructiveCode" when "experimentalModifyObstructiveThirdPartyCode" is true, even if "modifyObstructiveCode" is set to false.', async () => {
          prepareContext({
            res: {
              wantsInjection: 'full',
            },
            config: {
              modifyObstructiveCode: false,
              experimentalModifyObstructiveThirdPartyCode: true,
            },
          })

          await testMiddleware([SetInjectionLevel], ctx)
          expect(ctx.res.wantsSecurityRemoved).toBe(true)
        })

        const otherMIMEs = ['text/html', 'application/javascript', 'application/x-javascript', 'text/javascript']

        otherMIMEs.forEach((MIMEType) => {
          it(`removes security for ${MIMEType} MIME when "experimentalModifyObstructiveThirdPartyCode" is true, regardless of injection or request origin.`, async () => {
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

            await testMiddleware([SetInjectionLevel], ctx)
            expect(ctx.res.wantsSecurityRemoved).toBe(true)
          })
        })

        it(`removes security when the request will render html when "experimentalModifyObstructiveThirdPartyCode" is true, regardless of injection or request origin.`, async () => {
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

          await testMiddleware([SetInjectionLevel], ctx)
          expect(ctx.res.wantsSecurityRemoved).toBe(true)
        })

        it(`does not remove security or inject when the request will not render html (csv).`, async () => {
          prepareContext({
            renderedHTMLOrigins: {},
            getRenderedHTMLOrigins () {
              return this.renderedHTMLOrigins
            },
            req: {
              proxiedUrl: 'http://www.some-third-party-csv.csv',
              isAUTFrame: false,
              headers: {
                'accept': ['text/html', 'application/xhtml+xml'],
              },
            },
            incomingRes: {
              headers: {
                'content-type': 'text/csv',
              },
            },
            config: {
              modifyObstructiveCode: true,
              experimentalModifyObstructiveThirdPartyCode: true,
            },
          })

          await testMiddleware([SetInjectionLevel], ctx)
          expect(ctx.res.wantsSecurityRemoved).toBe(false)
          expect(ctx.res.wantsInjection).toBe(false)
        })
      })
    })

    function prepareContext (props) {
      // set the primary remote state
      remoteStates.set('http://127.0.0.1:3501')

      ctx = {
        incomingRes: {
          headers: {},
          ...props.incomingRes,
        },
        res: {
          headers: {},
          getHeaders: vi.fn().mockImplementation(() => {
            return ctx.res.headers
          }),
          setHeader: vi.fn(),
          on: (event, listener) => {},
          off: (event, listener) => {},
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

      expect(appendStub).toHaveBeenCalledTimes(2)
      expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie1=value1')
      expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie2=value2')
    })

    it('appends cookies on the response when a string', async function () {
      const { appendStub, ctx } = prepareSameOriginContext()

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(appendStub).toHaveBeenCalledExactlyOnceWith('Set-Cookie', 'cookie=value')
    })

    it('is a noop when cookies are undefined', async function () {
      const appendStub = vi.fn()
      const ctx = prepareContext({
        res: {
          append: appendStub,
        },
      })

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(appendStub).not.toHaveBeenCalled()
    })

    it('records cookie in jar but skips browser automation sync when top does not need simulating', async function () {
      const appendStub = vi.fn()

      const cookieJar = {
        getAllCookies: () => [{ key: 'cookie', value: 'value' }],
        getCookies: () => [],
        setCookie: vi.fn(),
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

      // the cookie is still recorded in the server-side cookie jar so it does not
      // go stale and overwrite fresh browser cookies on a later top-level
      // navigation. See https://github.com/cypress-io/cypress/issues/25841
      expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
        key: 'cookie',
        value: 'value',
      }), 'http://www.foobar.com/login', 'strict')

      // the browser sets the cookie itself since the AUT is the primary origin,
      // so we do not need to sync the cookie into the browser via automation
      expect(ctx.serverBus.emit).not.toHaveBeenCalled()
      expect(appendStub).toHaveBeenCalledExactlyOnceWith('Set-Cookie', 'cookie=value')
    })

    // https://github.com/cypress-io/cypress/issues/25841
    // A same-origin fetch/XHR response that sets a cookie does not need top to be
    // simulated (the AUT is the primary origin and is not the AUT frame), but the
    // cookie must still be recorded in the server-side jar. Otherwise the jar
    // keeps a stale value and overwrites the browser's fresh cookie on the next
    // top-level navigation (e.g. a reload following the request).
    ;['fetch', 'xhr'].forEach((resourceType) => {
      it(`records same-origin ${resourceType} response cookie in jar without browser automation sync`, async function () {
        const appendStub = vi.fn()

        const cookieJar = {
          getAllCookies: () => [],
          getCookies: () => [],
          setCookie: vi.fn(),
        }

        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a same-origin, non-AUT-frame request: top does not need simulating
            resourceType,
            credentialsLevel: resourceType === 'fetch' ? 'same-origin' : true,
            proxiedUrl: 'http://www.foobar.com/messages',
            isAUTFrame: false,
          },
          incomingRes: {
            headers: {
              'set-cookie': '_venuu_flash=fresh-value',
            },
          },
        })

        ctx.getAUTUrl = () => 'http://www.foobar.com/index.html'
        // the AUT is the primary super domain origin, so top does NOT need simulating
        ctx.remoteStates.isPrimarySuperDomainOrigin = () => true

        await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

        // the fresh cookie is recorded in the jar so a subsequent navigation does
        // not reuse a stale value
        expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
          key: '_venuu_flash',
          value: 'fresh-value',
        }), 'http://www.foobar.com/messages', 'strict')

        // the browser sets the cookie natively for a same-origin request, so no
        // automation sync is needed
        expect(ctx.serverBus.emit).not.toHaveBeenCalled()
        expect(appendStub).toHaveBeenCalledExactlyOnceWith('Set-Cookie', '_venuu_flash=fresh-value')
      })
    })

    const getCookieJarStub = () => {
      return {
        getAllCookies: vi.fn().mockReturnValue([{ key: 'cookie', value: 'value' }]),
        getCookies: vi.fn().mockReturnValue([]),
        setCookie: vi.fn(),
      }
    }

    describe('same-origin', () => {
      ['same-origin', 'include'].forEach((credentialLevel) => {
        it(`sets first-party cookie context in the jar when simulating top if credentials included with fetch with credential ${credentialLevel}`, async function () {
          const appendStub = vi.fn()
          const cookieJar = getCookieJarStub()
          const ctx = prepareContext({
            cookieJar,
            res: {
              append: appendStub,
            },
            req: {
              // a same-site request that has the ability to set first-party cookies in the browser
              resourceType: 'fetch',
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
          expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
            key: 'cookie1',
            value: 'value1',
            sameSite: 'strict',
          }), 'https://www.foobar.com/test-request', 'strict')

          // should work as this would be set in the browser if the AUT url was top
          expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
            key: 'cookie2',
            value: 'value2',
            sameSite: 'lax',
          }), 'https://www.foobar.com/test-request', 'strict')

          // should work as this would be set in the browser if the AUT url was top, just sets a third party cookie
          expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
            key: 'cookie3',
            value: 'value3',
            sameSite: 'none',
          }), 'https://www.foobar.com/test-request', 'strict')

          expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
          expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
          expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
        })
      })

      ;[true, false].forEach((credentialLevel) => {
        it(`sets first-party cookie context in the jar when simulating top if withCredentials ${credentialLevel} with xhr`, async function () {
          const appendStub = vi.fn()
          const cookieJar = getCookieJarStub()
          const ctx = prepareContext({
            cookieJar,
            res: {
              append: appendStub,
            },
            req: {
              // a same-site request that has the ability to set first-party cookies in the browser
              resourceType: 'xhr',
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
          expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
            key: 'cookie1',
            value: 'value1',
            sameSite: 'strict',
          }), 'https://www.foobar.com/test-request', 'strict')

          // should work as this would be set in the browser if the AUT url was top
          expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
            key: 'cookie2',
            value: 'value2',
            sameSite: 'lax',
          }), 'https://www.foobar.com/test-request', 'strict')

          // should work as this would be set in the browser if the AUT url was top, just sets a third party cookie
          expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
            key: 'cookie3',
            value: 'value3',
            sameSite: 'none',
          }), 'https://www.foobar.com/test-request', 'strict')

          expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
          expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
          expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
        })
      })

      it(`sets no cookies if fetch level is omit`, async function () {
        const appendStub = vi.fn()
        const cookieJar = getCookieJarStub()
        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a same-site request that has the ability to set first-party cookies in the browser
            resourceType: 'fetch',
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
        expect(cookieJar.setCookie).not.toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie1',
          value: 'value1',
          sameSite: 'strict',
        }), 'https://www.foobar.com/test-request', 'strict')

        // should not work as this wouldn't be set in the browser if the AUT url was top
        expect(cookieJar.setCookie).not.toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie2',
          value: 'value2',
          sameSite: 'lax',
        }), 'https://www.foobar.com/test-request', 'strict')

        // should not work as this wouldn't be set in the browser if the AUT url was top
        expect(cookieJar.setCookie).not.toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie3',
          value: 'value3',
          sameSite: 'none',
        }), 'https://www.foobar.com/test-request', 'strict')

        // return these to the browser, even though they are likely to fail setting anyway
        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })
    })

    describe('same-site', () => {
      it('sets first-party cookie context in the jar when simulating top if credentials included with fetch via include', async function () {
        const appendStub = vi.fn()
        const cookieJar = getCookieJarStub()
        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a same-site request that has the ability to set first-party cookies in the browser
            resourceType: 'fetch',
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
        expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie1',
          value: 'value1',
          sameSite: 'strict',
        }), 'https://app.foobar.com/test-request', 'strict')

        // should work as this would be set in the browser if the AUT url was top
        expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie2',
          value: 'value2',
          sameSite: 'lax',
        }), 'https://app.foobar.com/test-request', 'strict')

        // should work as this would be set in the browser if the AUT url was top, just sets a third party cookie
        expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie3',
          value: 'value3',
          sameSite: 'none',
        }), 'https://app.foobar.com/test-request', 'strict')

        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })

      it('sets first-party cookie context in the jar when simulating top if credentials true with xhr', async function () {
        const appendStub = vi.fn()
        const cookieJar = getCookieJarStub()
        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a same-site request that has the ability to set first-party cookies in the browser
            resourceType: 'xhr',
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
        expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie1',
          value: 'value1',
          sameSite: 'strict',
        }), 'https://app.foobar.com/test-request', 'strict')

        // should work as this would be set in the browser if the AUT url was top
        expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie2',
          value: 'value2',
          sameSite: 'lax',
        }), 'https://app.foobar.com/test-request', 'strict')

        // should work as this would be set in the browser if the AUT url was top, just sets a third party cookie
        expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie3',
          value: 'value3',
          sameSite: 'none',
        }), 'https://app.foobar.com/test-request', 'strict')

        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })

      ;['same-origin', 'omit'].forEach((credentialLevel) => {
        it(`sets no cookies if fetch level is ${credentialLevel}`, async function () {
          const appendStub = vi.fn()
          const cookieJar = getCookieJarStub()
          const ctx = prepareContext({
            cookieJar,
            res: {
              append: appendStub,
            },
            req: {
              // a same-site request that has the ability to set first-party cookies in the browser
              resourceType: 'fetch',
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
          expect(cookieJar.setCookie).not.toHaveBeenCalled()

          // return these to the browser, even though they are likely to fail setting anyway
          expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie1=value1; SameSite=Strict')
          expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie2=value2; SameSite=Lax')
          expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
        })
      })
    })

    describe('cross-site', () => {
      it('sets third-party cookie context in the jar when simulating top if credentials included with fetch', async function () {
        const appendStub = vi.fn()
        const cookieJar = getCookieJarStub()
        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a cross-site request that has the ability to set cookies in the browser
            resourceType: 'fetch',
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
        expect(cookieJar.setCookie).not.toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie1',
          value: 'value1',
          sameSite: 'strict',
        }), 'https://www.barbaz.com/test-request', 'none')

        // should not work as this wouldn't be set in the browser if the AUT url was top anyway
        expect(cookieJar.setCookie).not.toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie2',
          value: 'value2',
          sameSite: 'lax',
        }), 'https://www.barbaz.com/test-request', 'none')

        expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie3',
          value: 'value3',
          sameSite: 'none',
        }), 'https://www.barbaz.com/test-request', 'none')

        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })

      ;['same-origin', 'omit'].forEach((credentialLevel) => {
        it(`does NOT set third-party cookie context in the jar when simulating top if credentials ${credentialLevel} with fetch`, async function () {
          const appendStub = vi.fn()
          const cookieJar = getCookieJarStub()
          const ctx = prepareContext({
            cookieJar,
            res: {
              append: appendStub,
            },
            req: {
              // a cross-site request that has the ability to set cookies in the browser
              resourceType: 'fetch',
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

          expect(cookieJar.setCookie).not.toHaveBeenCalled()

          // send to browser anyway even though these will likely fail to be set
          expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
        })
      })

      it('sets third-party cookie context in the jar when simulating top if withCredentials true with xhr', async function () {
        const appendStub = vi.fn()
        const cookieJar = getCookieJarStub()
        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a cross-site request that has the ability to set cookies in the browser
            resourceType: 'xhr',
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
        expect(cookieJar.setCookie).not.toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie1',
          value: 'value1',
          sameSite: 'strict',
        }), 'https://www.barbaz.com/test-request', 'none')

        // should not work as this wouldn't be set in the browser if the AUT url was top anyway
        expect(cookieJar.setCookie).not.toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie2',
          value: 'value2',
          sameSite: 'lax',
        }), 'https://www.barbaz.com/test-request', 'none')

        expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
          key: 'cookie3',
          value: 'value3',
          sameSite: 'none',
        }), 'https://www.barbaz.com/test-request', 'none')

        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })

      it('does not set third-party cookie context in the jar when simulating top if withCredentials false with xhr', async function () {
        const appendStub = vi.fn()
        const cookieJar = getCookieJarStub()
        const ctx = prepareContext({
          cookieJar,
          res: {
            append: appendStub,
          },
          req: {
            // a cross-site request that has the ability to set cookies in the browser
            resourceType: 'xhr',
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

        expect(cookieJar.setCookie).not.toHaveBeenCalled()

        // send to the browser, even though the browser will NOT set this cookie
        expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })
    })

    it(`does NOT set third-party cookie context in the jar if secure cookie is not enabled`, async function () {
      const appendStub = vi.fn()
      const cookieJar = getCookieJarStub()
      const ctx = prepareContext({
        cookieJar,
        res: {
          append: appendStub,
        },
        req: {
          // a cross-site request that has the ability to set cookies in the browser
          resourceType: 'xhr',
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

      expect(cookieJar.setCookie).not.toHaveBeenCalled()

      // send to browser anyway even though these will likely fail to be set
      expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie3=value3; SameSite=None')
    })

    it(`allows setting cookies if request type cannot be determined, but comes from the AUT frame (likely in the case of documents or redirects)`, async function () {
      const appendStub = vi.fn()
      const cookieJar = getCookieJarStub()
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

      expect(cookieJar.setCookie).toHaveBeenCalledWith(expect.objectContaining({
        key: 'cookie',
        value: 'value',
        sameSite: 'lax',
      }), 'https://www.barbaz.com/index.html', 'lax')

      // send to browser anyway even though these will likely fail to be set
      expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie=value')
    })

    it(`otherwise, does not allow setting cookies if request type cannot be determined and is not from the AUT and is cross-origin`, async function () {
      const appendStub = vi.fn()
      const cookieJar = getCookieJarStub()
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

      expect(cookieJar.setCookie).not.toHaveBeenCalled()

      // send to browser anyway even though these will likely fail to be set
      expect(appendStub).toHaveBeenCalledWith('Set-Cookie', 'cookie=value')
    })

    it('does not send cross:origin:cookies if request does not need top simulation', async () => {
      const { ctx } = prepareSameOriginContext()

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(ctx.serverBus.emit).not.toHaveBeenCalled()
    })

    it('does not send cross:origin:cookies if there are no added cookies', async () => {
      const cookieJar = getCookieJarStub()
      const ctx = prepareContext({
        cookieJar,
        incomingRes: {
          headers: {
            'set-cookie': 'cookie=value',
          },
        },
      })

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(ctx.serverBus.emit).not.toHaveBeenCalled()
    })

    it('sends cross:origin:cookies with origin and cookies if there are added cookies and resolves on cross:origin:cookies:received', async () => {
      const cookieJar = getCookieJarStub()

      cookieJar.getAllCookies.mockReturnValueOnce([]).mockReturnValueOnce([cookieStub({ key: 'cookie', value: 'value' })])
      cookieJar.getAllCookies.mockReturnValueOnce([cookieStub({ key: 'cookie', value: 'value' })])

      const ctx = prepareContext({
        cookieJar,
        req: {
          isAUTFrame: true,
        },
        incomingRes: {
          headers: {
            'set-cookie': 'cookie=value',
          },
        },
      })

      const resultPromise = testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      await flushPromises()

      expect(ctx.serverBus.emit).toHaveBeenCalledWith('cross:origin:cookies', expect.any(Array))

      // test will hang if this.next() is not called, so this also tests
      // that we move on once receiving this event
      ctx.serverBus.emit('cross:origin:cookies:received')

      await resultPromise

      const cookies = ctx.serverBus.emit.mock.calls[0][1]

      expect(cookies[0].name).toEqual('cookie')
      expect(cookies[0].value).toEqual('value')
    })

    function prepareContext (props) {
      // set the primary remote state
      remoteStates.set('http://foobar.com')

      remoteStates.isPrimarySuperDomainOrigin = () => false

      const cookieJar = props.cookieJar || {
        getAllCookies: () => [],
        getCookies: () => [],
      }

      const serverBusMock = new EventEmitter()

      return {
        incomingRes: {
          headers: {},
          ...props.incomingRes,
        },
        res: {
          headers: {},
          on: (event, listener) => {},
          off: (event, listener) => {},
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
        getCookieJar: () => cookieJar,
        getAUTUrl: () => 'http://www.foobar.com/primary-origin.html',
        remoteStates,
        debug () {},
        onError (error) {
          throw error
        },
        serverBus: {
          emit: vi.fn<typeof serverBusMock.emit>().mockImplementation((event, ...args) => {
            return serverBusMock.emit(event, ...args)
          }),
          once: vi.fn<typeof serverBusMock.once>().mockImplementation((event, listener) => {
            return serverBusMock.once(event, listener)
          }),
        },
        ..._.omit(props, 'incomingRes', 'res', 'req'),
      }
    }

    function prepareSameOriginContext (props: { req?: object, incomingRes?: object, res?: object } = {}) {
      const appendStub = vi.fn()

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

  describe('MaybeEndWithEmptyBody', function () {
    const { MaybeEndWithEmptyBody } = ResponseMiddleware
    let ctx
    let responseEndedWithEmptyBodyStub

    beforeEach(() => {
      responseEndedWithEmptyBodyStub = vi.fn()
    })

    it('calls responseEndedWithEmptyBody on protocolManager if protocolManager present and request is correlated and response must have empty body and response is cached', async function () {
      prepareContext({
        protocolManager: {
          responseEndedWithEmptyBody: responseEndedWithEmptyBodyStub,
        },
        req: {
          browserPreRequest: {
            requestId: '123',
            cdpRequestWillBeSentTimestamp: 1,
            cdpRequestWillBeSentReceivedTimestamp: 2,
            proxyRequestReceivedTimestamp: 3,
            cdpLagDuration: 4,
            proxyRequestCorrelationDuration: 5,
          },
        },
        incomingRes: {
          statusCode: 304,
        },
      })

      await testMiddleware([MaybeEndWithEmptyBody], ctx)
      expect(responseEndedWithEmptyBodyStub).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '123',
          isCached: true,
          timings: expect.objectContaining({
            cdpRequestWillBeSentTimestamp: 1,
            cdpRequestWillBeSentReceivedTimestamp: 2,
            proxyRequestReceivedTimestamp: 3,
            cdpLagDuration: 4,
            proxyRequestCorrelationDuration: 5,
          }),
        }),
      )
    })

    it('calls responseEndedWithEmptyBody on protocolManager if protocolManager present and retried request is correlated and response must have empty body and response is not cached', async function () {
      prepareContext({
        protocolManager: {
          responseEndedWithEmptyBody: responseEndedWithEmptyBodyStub,
        },
        req: {
          browserPreRequest: {
            requestId: '123-retry-1',
          },
        },
        incomingRes: {
          statusCode: 204,
        },
      })

      await testMiddleware([MaybeEndWithEmptyBody], ctx)
      expect(responseEndedWithEmptyBodyStub).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '123',
          isCached: false,
        }),
      )
    })

    it('does not call responseEndedWithEmptyBody on protocolManager if protocolManager present and request is correlated and response is not empty', async function () {
      prepareContext({
        protocolManager: {
          responseEndedWithEmptyBody: responseEndedWithEmptyBodyStub,
        },
        req: {
          browserPreRequest: {
            requestId: '123',
          },
        },
        incomingRes: {
          statusCode: 200,
        },
      })

      await testMiddleware([MaybeEndWithEmptyBody], ctx)
      expect(responseEndedWithEmptyBodyStub).not.toHaveBeenCalled()
    })

    it('does not call responseEndedWithEmptyBody on protocolManager if protocolManager present and request is not correlated', async function () {
      prepareContext({
        protocolManager: {
          responseEndedWithEmptyBody: responseEndedWithEmptyBodyStub,
        },
        req: {
        },
        incomingRes: {
          statusCode: 304,
        },
      })

      await testMiddleware([MaybeEndWithEmptyBody], ctx)
      expect(responseEndedWithEmptyBodyStub).not.toHaveBeenCalled()
    })

    it('does not call responseEndedWithEmptyBody on protocolManager if protocolManager is not present and request is correlated', async function () {
      prepareContext({
        req: {
          browserPreRequest: {
            requestId: '123',
          },
        },
        incomingRes: {
          statusCode: 304,
        },
      })

      await testMiddleware([MaybeEndWithEmptyBody], ctx)
      expect(responseEndedWithEmptyBodyStub).not.toHaveBeenCalled()
    })

    describe('when origin response had Content-Length: 0', function () {
      // Regression coverage for cypress-io/cypress#16469: a DELETE 200 (or any
      // 200 with Content-Length: 0) was being re-emitted with Transfer-Encoding:
      // chunked, which broke clients that assumed there would be content.
      it('sends Content-Length: 0 and ends without piping a body', async function () {
        const setHeader = vi.fn()
        const end = vi.fn()

        prepareContext({
          req: {},
          incomingRes: {
            statusCode: 200,
          },
          incomingResHadEmptyBody: true,
          res: {
            on: (event, listener) => {},
            off: (event, listener) => {},
            setHeader,
            end,
            wantsInjection: false,
            wantsSecurityRemoved: false,
          },
        })

        await testMiddleware([MaybeEndWithEmptyBody], ctx)
        expect(setHeader).toHaveBeenCalledWith('Content-Length', '0')
        expect(end).toHaveBeenCalledOnce()
      })

      it('notifies protocolManager that the response ended with an empty body', async function () {
        prepareContext({
          protocolManager: {
            responseEndedWithEmptyBody: responseEndedWithEmptyBodyStub,
          },
          req: {
            browserPreRequest: {
              requestId: '123',
              cdpRequestWillBeSentTimestamp: 1,
              cdpRequestWillBeSentReceivedTimestamp: 2,
              proxyRequestReceivedTimestamp: 3,
              cdpLagDuration: 4,
              proxyRequestCorrelationDuration: 5,
            },
          },
          incomingRes: {
            statusCode: 200,
          },
          incomingResHadEmptyBody: true,
          res: {
            on: (event, listener) => {},
            off: (event, listener) => {},
            setHeader: vi.fn(),
            end: vi.fn(),
            wantsInjection: false,
            wantsSecurityRemoved: false,
          },
        })

        await testMiddleware([MaybeEndWithEmptyBody], ctx)
        expect(responseEndedWithEmptyBodyStub).toHaveBeenCalledWith(
          expect.objectContaining({
            requestId: '123',
            isCached: false,
            timings: expect.objectContaining({
              cdpRequestWillBeSentTimestamp: 1,
              cdpRequestWillBeSentReceivedTimestamp: 2,
              proxyRequestReceivedTimestamp: 3,
              cdpLagDuration: 4,
              proxyRequestCorrelationDuration: 5,
            }),
          }),
        )
      })

      it('does not short-circuit when downstream wants to inject HTML', async function () {
        const setHeader = vi.fn()
        const end = vi.fn()

        prepareContext({
          req: {},
          incomingRes: {
            statusCode: 200,
          },
          incomingResHadEmptyBody: true,
          res: {
            on: (event, listener) => {},
            off: (event, listener) => {},
            setHeader,
            end,
            wantsInjection: 'full',
            wantsSecurityRemoved: false,
          },
        })

        await testMiddleware([MaybeEndWithEmptyBody], ctx)
        expect(setHeader).not.toHaveBeenCalled()
        expect(end).not.toHaveBeenCalled()
      })

      it('does not short-circuit when downstream wants security stripped', async function () {
        const setHeader = vi.fn()
        const end = vi.fn()

        prepareContext({
          req: {},
          incomingRes: {
            statusCode: 200,
          },
          incomingResHadEmptyBody: true,
          res: {
            on: (event, listener) => {},
            off: (event, listener) => {},
            setHeader,
            end,
            wantsInjection: false,
            wantsSecurityRemoved: true,
          },
        })

        await testMiddleware([MaybeEndWithEmptyBody], ctx)
        expect(setHeader).not.toHaveBeenCalled()
        expect(end).not.toHaveBeenCalled()
      })

      it('does not short-circuit when a cy.intercept route matched (interceptor may have replaced the body)', async function () {
        const setHeader = vi.fn()
        const end = vi.fn()

        prepareContext({
          req: { requestId: 'req-42' },
          incomingRes: {
            statusCode: 200,
          },
          incomingResHadEmptyBody: true,
          netStubbingState: {
            requests: { 'req-42': {} },
          },
          res: {
            on: (event, listener) => {},
            off: (event, listener) => {},
            setHeader,
            end,
            wantsInjection: false,
            wantsSecurityRemoved: false,
          },
        })

        await testMiddleware([MaybeEndWithEmptyBody], ctx)
        expect(setHeader).not.toHaveBeenCalled()
        expect(end).not.toHaveBeenCalled()
      })
    })

    it('does not short-circuit a 200 response when origin did not send Content-Length: 0', async function () {
      const setHeader = vi.fn()
      const end = vi.fn()

      prepareContext({
        req: {},
        incomingRes: {
          statusCode: 200,
        },
        incomingResHadEmptyBody: false,
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
          setHeader,
          end,
        },
      })

      await testMiddleware([MaybeEndWithEmptyBody], ctx)
      expect(setHeader).not.toHaveBeenCalled()
      expect(end).not.toHaveBeenCalled()
    })

    function prepareContext (props) {
      ctx = {
        incomingRes: props.incomingRes,
        protocolManager: props.protocolManager,
        req: props.req,
        incomingResHadEmptyBody: props.incomingResHadEmptyBody,
        netStubbingState: props.netStubbingState,
        res: props.res || {
          on: (event, listener) => {},
          off: (event, listener) => {},
          end: () => {},
        },
      }
    }
  })

  describe('MaybeInjectHtml', function () {
    const { MaybeInjectHtml } = ResponseMiddleware
    let ctx
    let htmlStub: MockInstance

    beforeEach(() => {
      htmlStub = vi.spyOn(rewriter, 'html')
    })

    afterEach(() => {
      htmlStub.mockRestore()
    })

    ;[true, false].forEach((injectDocumentDomain) => {
      describe(`when injectDocumentDomain is ${injectDocumentDomain}`, () => {
        const config = {
          modifyObstructiveCode: true,
          experimentalModifyObstructiveThirdPartyCode: true,
          injectDocumentDomain,
          testingType: 'e2e',
        }

        it('modifyObstructiveThirdPartyCode is true for secondary requests', async function () {
          prepareContext({
            req: {
              proxiedUrl: 'http://www.foobar.com:3501/primary-origin.html',
            },
            config,
            simulatedCookies: [],
          })

          await testMiddleware([MaybeInjectHtml], ctx)
          expect(htmlStub).toHaveBeenCalledOnce()
          expect(htmlStub).toHaveBeenCalledWith('foo', expect.objectContaining({
            'cspNonce': undefined,
            'deferSourceMapRewrite': undefined,
            'domainName': 'foobar.com',
            'isNotJavascript': true,
            'modifyObstructiveCode': true,
            'modifyObstructiveThirdPartyCode': true,
            'shouldInjectDocumentDomain': injectDocumentDomain,
            'url': 'http://www.foobar.com:3501/primary-origin.html',
            'useAstSourceRewriting': undefined,
            'wantsInjection': 'full',
            'wantsSecurityRemoved': true,
            'simulatedCookies': [],
          }))
        })

        it('modifyObstructiveThirdPartyCode is false for primary requests', async function () {
          prepareContext({
            simulatedCookies: [],
            config,
          })

          await testMiddleware([MaybeInjectHtml], ctx)
          expect(htmlStub).toHaveBeenCalledOnce()
          expect(htmlStub).toHaveBeenCalledWith('foo', expect.objectContaining({
            'cspNonce': undefined,
            'deferSourceMapRewrite': undefined,
            'domainName': '127.0.0.1',
            'isNotJavascript': true,
            'modifyObstructiveCode': true,
            'modifyObstructiveThirdPartyCode': false,
            'shouldInjectDocumentDomain': injectDocumentDomain,
            'url': 'http://127.0.0.1:3501/primary-origin.html',
            'useAstSourceRewriting': undefined,
            'wantsInjection': 'full',
            'wantsSecurityRemoved': true,
            'simulatedCookies': [],
          }))
        })

        it('cspNonce is set to the value stored in res.injectionNonce', async function () {
          prepareContext({
            req: {
              proxiedUrl: 'http://www.foobar.com:3501/primary-origin.html',
            },
            config,
            res: {
              injectionNonce: 'fake-nonce',
            },
            simulatedCookies: [],
          })

          await testMiddleware([MaybeInjectHtml], ctx)
          expect(htmlStub).toHaveBeenCalledOnce()
          expect(htmlStub).toHaveBeenCalledWith('foo', expect.objectContaining({
            'cspNonce': 'fake-nonce',
            'deferSourceMapRewrite': undefined,
            'domainName': 'foobar.com',
            'isNotJavascript': true,
            'modifyObstructiveCode': true,
            'modifyObstructiveThirdPartyCode': true,
            'shouldInjectDocumentDomain': injectDocumentDomain,
            'url': 'http://www.foobar.com:3501/primary-origin.html',
            'useAstSourceRewriting': undefined,
            'wantsInjection': 'full',
            'wantsSecurityRemoved': true,
            'simulatedCookies': [],
          }))
        })
      })
    })

    function prepareContext (props) {
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
          on: (event, listener) => {},
          off: (event, listener) => {},
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
          injectDocumentDomain: false,
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
    let securityStub: MockInstance

    beforeEach(() => {
      securityStub = vi.spyOn(rewriter, 'security')
    })

    afterEach(() => {
      securityStub.mockRestore()
    })

    it('modifyObstructiveThirdPartyCode is true for secondary requests', async function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://www.foobar.com:3501/primary-origin.html',
        },
      })

      await testMiddleware([MaybeRemoveSecurity], ctx)
      expect(securityStub).toHaveBeenCalledOnce()
      expect(securityStub).toHaveBeenCalledWith(expect.objectContaining({
        'deferSourceMapRewrite': undefined,
        'isNotJavascript': true,
        'modifyObstructiveCode': true,
        'modifyObstructiveThirdPartyCode': true,
        'url': 'http://www.foobar.com:3501/primary-origin.html',
        'useAstSourceRewriting': undefined,
      }))
    })

    it('modifyObstructiveThirdPartyCode is false for primary requests', async function () {
      prepareContext({})

      await testMiddleware([MaybeRemoveSecurity], ctx)
      expect(securityStub).toHaveBeenCalledOnce()
      expect(securityStub).toHaveBeenCalledWith(expect.objectContaining({
        'deferSourceMapRewrite': undefined,
        'isNotJavascript': true,
        'modifyObstructiveCode': true,
        'modifyObstructiveThirdPartyCode': false,
        'url': 'http://127.0.0.1:3501/primary-origin.html',
        'useAstSourceRewriting': undefined,
      }))
    })

    it('modifyObstructiveThirdPartyCode is false when experimental flag is false', async function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://www.foobar.com:3501/primary-origin.html',
        },
        config: {
          modifyObstructiveCode: false,
          experimentalModifyObstructiveThirdPartyCode: false,
        },
      })

      await testMiddleware([MaybeRemoveSecurity], ctx)
      expect(securityStub).toHaveBeenCalledOnce()
      expect(securityStub).toHaveBeenCalledWith(expect.objectContaining({
        'deferSourceMapRewrite': undefined,
        'isNotJavascript': true,
        'modifyObstructiveCode': false,
        'modifyObstructiveThirdPartyCode': false,
        'url': 'http://www.foobar.com:3501/primary-origin.html',
        'useAstSourceRewriting': undefined,
      }))
    })

    function prepareContext (props) {
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
          on: (event, listener) => {},
          off: (event, listener) => {},
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

  describe('MaybeInjectServiceWorker', function () {
    const { MaybeInjectServiceWorker } = ResponseMiddleware
    let ctx
    let injectIntoServiceWorkerStub: MockInstance

    beforeEach(() => {
      injectIntoServiceWorkerStub = vi.spyOn(serviceWorkerInjector, 'injectIntoServiceWorker')
    })

    afterEach(() => {
      injectIntoServiceWorkerStub.mockRestore()
    })

    it('does not rewrite the service worker if the request does not have the service worker header', async function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://www.foobar.com:3501/not-service-worker.js',
        },
      })

      await testMiddleware([MaybeInjectServiceWorker], ctx)
      expect(injectIntoServiceWorkerStub).not.toHaveBeenCalled()
    })

    it('does not rewrite the service worker if the browser is non-chromium', async function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://www.foobar.com:3501/service-worker.js',
          headers: {
            'service-worker': 'script',
          },
        },
        getCurrentBrowser: () => {
          return {
            family: 'firefox',
          }
        },
      })

      await testMiddleware([MaybeInjectServiceWorker], ctx)
      expect(injectIntoServiceWorkerStub).not.toHaveBeenCalled()
    })

    it('rewrites the service worker in chromium based browsers', async function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://www.foobar.com:3501/service-worker.js',
          headers: {
            'service-worker': 'script',
          },
        },
      })

      await testMiddleware([MaybeInjectServiceWorker], ctx)
      expect(injectIntoServiceWorkerStub).toHaveBeenCalledOnce()
      expect(injectIntoServiceWorkerStub).toHaveBeenCalledWith('foo')
    })

    function prepareContext (props) {
      const stream = Readable.from(['foo'])

      // set the primary remote state
      remoteStates.set('http://127.0.0.1:3501')

      ctx = {
        incomingRes: {
          headers: {},
          ...props.incomingRes,
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
          ...props.res,
        },
        req: {
          ...props.req,
        },
        makeResStreamPlainText () {},
        incomingResStream: stream,
        config: {},
        remoteStates,
        debug: (formatter, ...args) => {
          debugVerbose(`%s %s %s ${formatter}`, ctx.req.method, ctx.req.proxiedUrl, ctx.stage, ...args)
        },
        onError (error) {
          throw error
        },
        getCurrentBrowser: () => {
          return {
            family: 'chromium',
          }
        },
        ..._.omit(props, 'incomingRes', 'res', 'req'),
      }
    }
  })

  describe('CompressBody', function () {
    const { CompressBody } = ResponseMiddleware
    let ctx
    let responseStreamReceivedStub: Mock

    beforeEach(() => {
      responseStreamReceivedStub = vi.fn()
    })

    it('calls responseStreamReceived on protocolManager if protocolManager present and request is correlated', async function () {
      const stream = Readable.from(['foo'])
      const headers = { 'content-encoding': 'gzip' }
      const res = {
        on: (event, listener) => {},
        off: (event, listener) => {},
      }

      prepareContext({
        protocolManager: {
          responseStreamReceived: responseStreamReceivedStub,
        },
        req: {
          browserPreRequest: {
            requestId: '123',
            cdpRequestWillBeSentTimestamp: 1,
            cdpRequestWillBeSentReceivedTimestamp: 2,
            proxyRequestReceivedTimestamp: 3,
            cdpLagDuration: 4,
            proxyRequestCorrelationDuration: 5,
          },
        },
        res,
        incomingRes: {
          headers,
        },
        isGunzipped: true,
        incomingResStream: stream,
      })

      await testMiddleware([CompressBody], ctx)
      expect(responseStreamReceivedStub).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '123',
          responseHeaders: headers,
          isAlreadyGunzipped: true,
          responseStream: stream,
          res,
          timings: {
            cdpRequestWillBeSentTimestamp: 1,
            cdpRequestWillBeSentReceivedTimestamp: 2,
            proxyRequestReceivedTimestamp: 3,
            cdpLagDuration: 4,
            proxyRequestCorrelationDuration: 5,
          },
        }),
      )
    })

    it('calls responseStreamReceived on protocolManager if protocolManager present and retried request is correlated', async function () {
      const stream = Readable.from(['foo'])
      const headers = { 'content-encoding': 'gzip' }
      const res = {
        on: (event, listener) => {},
        off: (event, listener) => {},
      }

      prepareContext({
        protocolManager: {
          responseStreamReceived: responseStreamReceivedStub,
        },
        req: {
          browserPreRequest: {
            requestId: '123-retry-1',
          },
        },
        res,
        incomingRes: {
          headers,
        },
        isGunzipped: true,
        incomingResStream: stream,
      })

      await testMiddleware([CompressBody], ctx)
      expect(responseStreamReceivedStub).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '123',
          responseHeaders: headers,
          isAlreadyGunzipped: true,
          responseStream: stream,
          res,
        }),
      )
    })

    it('does not call responseStreamReceived on protocolManager if protocolManager present and request is not correlated', async function () {
      const stream = Readable.from(['foo'])
      const headers = { 'content-encoding': 'gzip' }

      prepareContext({
        protocolManager: {
          responseStreamReceived: responseStreamReceivedStub,
        },
        req: {
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
        incomingRes: {
          headers,
        },
        isGunzipped: true,
        incomingResStream: stream,
      })

      await testMiddleware([CompressBody], ctx)
      expect(responseStreamReceivedStub).not.toHaveBeenCalled()
    })

    it('does not call responseStreamReceived on protocolManager if protocolManager is not present and request is correlated', async function () {
      const stream = Readable.from(['foo'])
      const headers = { 'content-encoding': 'gzip' }

      prepareContext({
        req: {
          browserPreRequest: {
            requestId: '123',
          },
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
        incomingRes: {
          headers,
        },
        isGunzipped: true,
        incomingResStream: stream,
      })

      await testMiddleware([CompressBody], ctx)
      expect(responseStreamReceivedStub).not.toHaveBeenCalled()
    })

    it('calls responseStreamReceived with isAlreadyBrotliDecompressed when isBrotliDecompressed is true', async function () {
      const stream = Readable.from(['foo'])
      const headers = { 'content-encoding': 'br' }
      const res = {
        on: (event, listener) => {},
        off: (event, listener) => {},
      }

      prepareContext({
        protocolManager: {
          responseStreamReceived: responseStreamReceivedStub,
        },
        req: {
          browserPreRequest: {
            requestId: '123',
            cdpRequestWillBeSentTimestamp: 1,
            cdpRequestWillBeSentReceivedTimestamp: 2,
            proxyRequestReceivedTimestamp: 3,
            cdpLagDuration: 4,
            proxyRequestCorrelationDuration: 5,
          },
        },
        res,
        incomingRes: {
          headers,
        },
        isGunzipped: false,
        isBrotliDecompressed: true,
        incomingResStream: stream,
      })

      await testMiddleware([CompressBody], ctx)
      expect(responseStreamReceivedStub).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: '123',
          responseHeaders: headers,
          isAlreadyGunzipped: false,
          isAlreadyBrotliDecompressed: true,
          responseStream: stream,
          res,
        }),
      )
    })

    it('does not re-compress gzip when contentEncodingOrder includes gzip but isGunzipped is false', async function () {
      const plaintext = 'foo'
      const stream = Readable.from([plaintext])
      const res = {
        on: (_e: string, _l: () => void) => {},
        off: (_e: string, _l: () => void) => {},
      }

      prepareContext({
        req: {},
        res,
        incomingRes: { headers: { 'content-encoding': 'gzip' } },
        isGunzipped: false,
        isBrotliDecompressed: false,
        contentEncodingOrder: ['gzip'],
        incomingResStream: stream,
      })

      await testMiddleware([CompressBody], ctx)

      const chunks: Buffer[] = []

      for await (const chunk of ctx.incomingResStream) {
        chunks.push(Buffer.from(chunk))
      }

      const output = Buffer.concat(chunks).toString()

      expect(output).toBe(plaintext)
      expect(zlib.gzipSync(Buffer.from(plaintext)).toString()).not.toBe(plaintext)
    })

    it('does not re-compress br when contentEncodingOrder includes br but isBrotliDecompressed is false', async function () {
      const plaintext = 'bar'
      const stream = Readable.from([plaintext])
      const res = {
        on: (_e: string, _l: () => void) => {},
        off: (_e: string, _l: () => void) => {},
      }

      prepareContext({
        req: {},
        res,
        incomingRes: { headers: { 'content-encoding': 'br' } },
        isGunzipped: false,
        isBrotliDecompressed: false,
        contentEncodingOrder: ['br'],
        incomingResStream: stream,
      })

      await testMiddleware([CompressBody], ctx)

      const chunks: Buffer[] = []

      for await (const chunk of ctx.incomingResStream) {
        chunks.push(Buffer.from(chunk))
      }

      const output = Buffer.concat(chunks).toString()

      expect(output).toBe(plaintext)
    })

    function prepareContext (props) {
      const order =
        props.contentEncodingOrder !== undefined
          ? [...props.contentEncodingOrder]
          : []

      if (props.contentEncodingOrder === undefined) {
        if (props.isGunzipped) order.push('gzip')

        if (props.isBrotliDecompressed) order.push('br')
      }

      ctx = {
        incomingRes: props.incomingRes,
        protocolManager: props.protocolManager,
        req: props.req,
        res: props.res,
        isGunzipped: props.isGunzipped,
        isBrotliDecompressed: props.isBrotliDecompressed,
        contentEncodingOrder: order,
        incomingResStream: props.incomingResStream,
        makeResStreamPlainText: props.makeResStreamPlainText,
      }
    }
  })

  describe('AttachPlainTextStreamFn', function () {
    const { AttachPlainTextStreamFn } = ResponseMiddleware

    it('decompresses Brotli and sets isBrotliDecompressed when content-encoding is br', async function () {
      const compressed = zlib.brotliCompressSync(Buffer.from('hello'))
      const stream = Readable.from([compressed])
      const ctx = {
        debug: () => {},
        res: {
          on: (_event, _listener) => {},
          off: (_event, _listener) => {},
        },
        incomingRes: { headers: { 'content-encoding': 'br' } },
        incomingResStream: stream,
        isGunzipped: false,
        isBrotliDecompressed: false,
        contentEncodingOrder: [],
        makeResStreamPlainText: () => {},
        onError: (err) => {
          throw err
        },
      }

      await testMiddleware([AttachPlainTextStreamFn], ctx)
      ctx.makeResStreamPlainText()
      expect(ctx.isBrotliDecompressed).toBe(true)
      expect(ctx.contentEncodingOrder).toEqual(['br'])
      const chunks: Buffer[] = []

      for await (const chunk of ctx.incomingResStream) {
        chunks.push(Buffer.from(chunk))
      }
      expect(Buffer.concat(chunks).toString()).toBe('hello')
    })

    it('decompresses layered content-encoding in reverse order (br then gzip for "gzip, br")', async function () {
      // content-encoding: gzip, br means gzip applied first, then br. Wire format: br(gzip(data)).
      const inner = zlib.gzipSync(Buffer.from('layered'))
      const outer = zlib.brotliCompressSync(inner)
      const stream = Readable.from([outer])
      const ctx = {
        debug: () => {},
        res: { on: () => {}, off: () => {} },
        incomingRes: { headers: { 'content-encoding': 'gzip, br' } },
        incomingResStream: stream,
        isGunzipped: false,
        isBrotliDecompressed: false,
        contentEncodingOrder: [],
        makeResStreamPlainText: () => {},
        onError: (err) => {
          throw err
        },
      }

      await testMiddleware([AttachPlainTextStreamFn], ctx)
      ctx.makeResStreamPlainText()
      expect(ctx.contentEncodingOrder).toEqual(['gzip', 'br'])
      expect(ctx.isGunzipped).toBe(true)
      expect(ctx.isBrotliDecompressed).toBe(true)
      const chunks: Buffer[] = []

      for await (const chunk of ctx.incomingResStream) {
        chunks.push(Buffer.from(chunk))
      }
      expect(Buffer.concat(chunks).toString()).toBe('layered')
    })
  })
})
