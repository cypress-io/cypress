import _ from 'lodash'
import ResponseMiddleware from '../../../lib/http/response-middleware'
import { debugVerbose } from '../../../lib/http'
import { expect } from 'chai'
import sinon from 'sinon'
import { testMiddleware } from './helpers'
import { RemoteStates } from '@packages/server/lib/remote_states'
import { Readable } from 'stream'
import * as rewriter from '../../../lib/http/util/rewriter'
import { nonceDirectives, problematicCspDirectives, unsupportedCSPDirectives } from '../../../lib/http/util/csp-header'

describe('http/response-middleware', function () {
  it('exports the members in the correct order', function () {
    expect(_.keys(ResponseMiddleware)).to.have.ordered.members([
      'LogResponse',
      'AttachPlainTextStreamFn',
      'InterceptResponse',
      'PatchExpressSetHeader',
      'OmitProblematicHeaders',
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
      'GzipBody',
      'SendResponseBodyToClient',
    ])
  })

  describe('multiple this.next invocations', () => {
    context('within the same middleware', () => {
      it('throws an error', function (done) {
        const middleware = function () {
          this.next()
          this.next()
        }

        testMiddleware([middleware], {
          res: {
            on: (event, listener) => {},
            off: (event, listener) => {},
          },
          onError (err) {
            expect(err.message).to.equal('Internal error while proxying "undefined undefined" in 0:\nError running proxy middleware: Detected `this.next()` was called more than once in the same middleware function, but a middleware can only be completed once.')

            done()
          },
        })
      })

      it('includes a previous context error in error message if one exists', (done) => {
        const middleware = function () {
          this.next()
          this.next()
        }
        const error = new Error('previous error')

        testMiddleware([middleware], {
          error,
          res: {
            on: (event, listener) => {},
            off: (event, listener) => {},
          },
          onError (err) {
            expect(err.message).to.contain('This middleware invocation previously encountered an error which may be related, see `error.cause`')
            expect(err['cause']).to.equal(error)
            done()
          },
          method: 'GET',
          proxiedUrl: 'url',
        })
      })
    })

    context('across different middleware', () => {
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
          getHeaders: () => headers,
          set: sinon.stub(),
          removeHeader: sinon.stub(),
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
      it(`always removes "${prop}" from incoming headers`, function () {
        prepareContext({ [prop]: 'foo' })

        return testMiddleware([OmitProblematicHeaders], ctx)
        .then(() => {
          expect(ctx.res.set).to.be.calledWith(sinon.match(function (actual) {
            return actual[prop] === undefined
          }))
        })
      })
    })

    const validCspHeaderNames = [
      'content-security-policy',
      'Content-Security-Policy',
      'content-security-policy-report-only',
      'Content-Security-Policy-Report-Only',
    ]

    unsupportedCSPDirectives.forEach((directive) => {
      validCspHeaderNames.forEach((headerName) => {
        it(`always removes "${directive}" directive from "${headerName}" headers 'when experimentalCspAllowList is true`, () => {
          prepareContext({
            [`${headerName}`]: `${directive} 'fake-csp-${directive}-value'; fake-csp-directive fake-csp-value`,
          }, {
            experimentalCspAllowList: true,
          })

          return testMiddleware([OmitProblematicHeaders], ctx)
          .then(() => {
            expect(ctx.res.setHeader).to.be.calledWith(headerName.toLowerCase(), [
              'fake-csp-directive fake-csp-value',
            ])
          })
        })

        it(`always removes "${directive}" from "${headerName}" headers when experimentalCspAllowList is an empty array`, () => {
          prepareContext({
            [`${headerName}`]: `${directive} 'fake-csp-${directive}-value'; fake-csp-directive fake-csp-value`,
          }, {
            experimentalCspAllowList: [],
          })

          return testMiddleware([OmitProblematicHeaders], ctx)
          .then(() => {
            expect(ctx.res.setHeader).to.be.calledWith(headerName.toLowerCase(), [
              'fake-csp-directive fake-csp-value',
            ])
          })
        })

        it(`always removes "${directive}" from "${headerName}" headers when experimentalCspAllowList is an array including "${directive}"`, () => {
          prepareContext({
            [`${headerName}`]: `${directive} 'fake-csp-${directive}-value'; fake-csp-directive fake-csp-value`,
          }, {
            experimentalCspAllowList: [`${directive}`],
          })

          return testMiddleware([OmitProblematicHeaders], ctx)
          .then(() => {
            expect(ctx.res.setHeader).to.be.calledWith(headerName.toLowerCase(), [
              'fake-csp-directive fake-csp-value',
            ])
          })
        })
      })
    })

    validCspHeaderNames.forEach((headerName) => {
      it(`removes "${headerName}" headers when experimentalCspAllowList is false`, () => {
        prepareContext({
          [`${headerName}`]: `fake-csp-directive fake-csp-value`,
        }, {
          experimentalCspAllowList: false,
        })

        return testMiddleware([OmitProblematicHeaders], ctx)
        .then(() => {
          expect(ctx.res.removeHeader).to.be.calledWith(headerName.toLowerCase())
        })
      })
    })

    validCspHeaderNames.forEach((headerName) => {
      it(`will not remove invalid problematicCspDirectives directives provided from "${headerName}" headers when experimentalCspAllowList is an array of directives`, () => {
        prepareContext({
          [`${headerName}`]: `fake-csp-directive-0 fake-csp-value-0; fake-csp-directive-1 fake-csp-value-1; fake-csp-directive-2 fake-csp-value-2`,
        }, {
          experimentalCspAllowList: ['fake-csp-directive-1'],
        })

        return testMiddleware([OmitProblematicHeaders], ctx)
        .then(() => {
          expect(ctx.res.setHeader).to.be.calledWith(headerName.toLowerCase(), [
            'fake-csp-directive-0 fake-csp-value-0; fake-csp-directive-1 fake-csp-value-1; fake-csp-directive-2 fake-csp-value-2',
          ])
        })
      })
    })

    validCspHeaderNames.forEach((headerName) => {
      problematicCspDirectives.forEach((directive) => {
        it(`will allow problematicCspDirectives provided from "${headerName}" headers when experimentalCspAllowList is an array including "${directive}"`, () => {
          prepareContext({
            [`${headerName}`]: `fake-csp-directive fake-csp-value; ${directive} fake-csp-${directive}-value`,
          }, {
            experimentalCspAllowList: [directive],
          })

          return testMiddleware([OmitProblematicHeaders], ctx)
          .then(() => {
            expect(ctx.res.setHeader).to.be.calledWith(headerName.toLowerCase(), [
              `fake-csp-directive fake-csp-value; ${directive} fake-csp-${directive}-value`,
            ])
          })
        })

        problematicCspDirectives.forEach((otherDirective) => {
          if (directive === otherDirective) return

          it(`will still remove other problematicCspDirectives provided from "${headerName}" headers when experimentalCspAllowList is an array including singe directives "${directive}"`, () => {
            prepareContext({
              [`${headerName}`]: `${directive} fake-csp-${directive}-value; fake-csp-directive fake-csp-value; ${otherDirective} fake-csp-${otherDirective}-value`,
            }, {
              experimentalCspAllowList: [directive],
            })

            return testMiddleware([OmitProblematicHeaders], ctx)
            .then(() => {
              expect(ctx.res.setHeader).to.be.calledWith(headerName.toLowerCase(), [
                `${directive} fake-csp-${directive}-value; fake-csp-directive fake-csp-value`,
              ])
            })
          })

          it(`will allow both problematicCspDirectives provided from "${headerName}" headers when experimentalCspAllowList is an array including multiple directives ["${directive}","${otherDirective}"]`, () => {
            prepareContext({
              [`${headerName}`]: `${directive} fake-csp-${directive}-value; fake-csp-directive fake-csp-value; ${otherDirective} fake-csp-${otherDirective}-value`,
            }, {
              experimentalCspAllowList: [directive, otherDirective],
            })

            return testMiddleware([OmitProblematicHeaders], ctx)
            .then(() => {
              expect(ctx.res.setHeader).to.be.calledWith(headerName.toLowerCase(), [
                `${directive} fake-csp-${directive}-value; fake-csp-directive fake-csp-value; ${otherDirective} fake-csp-${otherDirective}-value`,
              ])
            })
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
          removeHeader: sinon.stub(),
          set: sinon.stub(),
          setHeader: sinon.stub(),
          on: (event, listener) => {},
          off: (event, listener) => {},
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

    it('injects "fullCrossOrigin" when request is cross-origin html', function () {
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
            it(`modifies existing "${validNonceDirectiveName}" directive for "${headerName}" header if injection is requested, header exists, and "${validNonceDirectiveName}" directive exists`, () => {
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

              return testMiddleware([SetInjectionLevel], ctx)
              .then(() => {
                expect(ctx.res.setHeader).to.be.calledWith(headerName.toLowerCase(),
                  [sinon.match(new RegExp(`^fake-csp-directive fake-csp-value; ${validNonceDirectiveName} 'fake-src' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'$`))])
              })
            })

            it(`modifies all existing "${validNonceDirectiveName}" directives for "${headerName}" header if injection is requested, and multiple headers exist with "${validNonceDirectiveName}" directives`, () => {
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

              return testMiddleware([SetInjectionLevel], ctx)
              .then(() => {
                expect(ctx.res.setHeader).to.be.calledWith(headerName.toLowerCase(),
                  [
                    sinon.match(new RegExp(`^fake-csp-directive-0 fake-csp-value-0; ${validNonceDirectiveName} 'fake-src-0' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'$`)),
                    sinon.match(new RegExp(`^${validNonceDirectiveName} 'fake-src-1' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'$`)),
                  ])
              })
            })

            it(`does not modify existing "${validNonceDirectiveName}" directive for "${headerName}" header if injection is not requested`, () => {
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

              return testMiddleware([SetInjectionLevel], ctx)
              .then(() => {
                expect(ctx.res.setHeader).not.to.be.calledWith(headerName, sinon.match.array)
                expect(ctx.res.setHeader).not.to.be.calledWith(headerName.toLowerCase(), sinon.match.array)
              })
            })

            it(`does not modify existing "${validNonceDirectiveName}" directive for non-csp headers`, () => {
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

              return testMiddleware([SetInjectionLevel], ctx)
              .then(() => {
                expect(ctx.res.setHeader).not.to.be.calledWith(nonCspHeader, sinon.match.array)
                expect(ctx.res.setHeader).not.to.be.calledWith(nonCspHeader.toLowerCase(), sinon.match.array)
              })
            })

            nonceDirectives.filter((directive) => directive !== validNonceDirectiveName).forEach((otherNonceDirective) => {
              it(`modifies existing "${otherNonceDirective}" directive for "${headerName}" header if injection is requested, header exists, and "${validNonceDirectiveName}" directive exists`, () => {
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

                return testMiddleware([SetInjectionLevel], ctx)
                .then(() => {
                  expect(ctx.res.setHeader).to.be.calledWith(headerName.toLowerCase(),
                    [sinon.match(new RegExp(`^${validNonceDirectiveName} 'self' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'; fake-csp-directive fake-csp-value; ${otherNonceDirective} 'fake-src' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'$`))])
                })
              })

              it(`modifies existing "${otherNonceDirective}" directive for "${headerName}" header if injection is requested, header exists, and "${validNonceDirectiveName}" directive exists in a different header`, () => {
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

                return testMiddleware([SetInjectionLevel], ctx)
                .then(() => {
                  expect(ctx.res.setHeader).to.be.calledWith(headerName.toLowerCase(),
                    [
                      sinon.match(new RegExp(`^${validNonceDirectiveName} 'self' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'`)),
                      sinon.match(new RegExp(`^fake-csp-directive fake-csp-value; ${otherNonceDirective} 'fake-src' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'$`)),
                    ])
                })
              })
            })
          })

          it(`does not append script-src directive in "${headerName}" headers if injection is requested, header exists, but no valid directive exists`, () => {
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

            return testMiddleware([SetInjectionLevel], ctx)
            .then(() => {
              // If directive doesn't exist, it shouldn't be updated
              expect(ctx.res.setHeader).not.to.be.calledWith(headerName, sinon.match.array)
              expect(ctx.res.setHeader).not.to.be.calledWith(headerName.toLowerCase(), sinon.match.array)
            })
          })

          it(`does not append script-src directive in "${headerName}" headers if injection is requested, and multiple headers exists, but no valid directive exists`, () => {
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

            return testMiddleware([SetInjectionLevel], ctx)
            .then(() => {
              // If directive doesn't exist, it shouldn't be updated
              expect(ctx.res.setHeader).not.to.be.calledWith(headerName, sinon.match.array)
              expect(ctx.res.setHeader).not.to.be.calledWith(headerName.toLowerCase(), sinon.match.array)
            })
          })

          it(`does not modify "${headerName}" header if full injection is requested, and header does not exist`, () => {
            prepareContext({
              res: {
                getHeaders: () => {
                  return {}
                },
                wantsInjection: 'full',
              },
            })

            return testMiddleware([SetInjectionLevel], ctx)
            .then(() => {
              expect(ctx.res.setHeader).not.to.be.calledWith(headerName, sinon.match.array)
              expect(ctx.res.setHeader).not.to.be.calledWith(headerName.toLowerCase(), sinon.match.array)
            })
          })

          it(`does not modify "${headerName}" header when no injection is requested, and header exists`, () => {
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

            return testMiddleware([SetInjectionLevel], ctx)
            .then(() => {
              expect(ctx.res.setHeader).not.to.be.calledWith(headerName, sinon.match.array)
              expect(ctx.res.setHeader).not.to.be.calledWith(headerName.toLowerCase(), sinon.match.array)
            })
          })
        })
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

        it(`does not remove security or inject when the request will not render html (csv).`, () => {
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

          return testMiddleware([SetInjectionLevel], ctx)
          .then(() => {
            expect(ctx.res.wantsSecurityRemoved).to.be.false
            expect(ctx.res.wantsInjection).to.be.false
          })
        })
      })
    })

    function prepareContext (props) {
      const remoteStates = new RemoteStates(() => {})

      // set the primary remote state
      remoteStates.set('http://127.0.0.1:3501')

      ctx = {
        incomingRes: {
          headers: {},
          ...props.incomingRes,
        },
        res: {
          headers: {},
          getHeaders: sinon.stub().callsFake(() => {
            return ctx.res.headers
          }),
          setHeader: sinon.stub(),
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

    const getCookieJarStub = () => {
      return {
        getAllCookies: sinon.stub().returns([{ key: 'cookie', value: 'value' }]),
        getCookies: sinon.stub().returns([]),
        setCookie: sinon.stub(),
      }
    }

    describe('same-origin', () => {
      ['same-origin', 'include'].forEach((credentialLevel) => {
        it(`sets first-party cookie context in the jar when simulating top if credentials included with fetch with credential ${credentialLevel}`, async function () {
          const appendStub = sinon.stub()
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

          expect(cookieJar.setCookie).not.to.have.been.called

          // send to browser anyway even though these will likely fail to be set
          expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
        })
      })

      it('sets third-party cookie context in the jar when simulating top if withCredentials true with xhr', async function () {
        const appendStub = sinon.stub()
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

        expect(cookieJar.setCookie).not.to.have.been.called

        // send to the browser, even though the browser will NOT set this cookie
        expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None; Secure')
      })
    })

    it(`does NOT set third-party cookie context in the jar if secure cookie is not enabled`, async function () {
      const appendStub = sinon.stub()
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

      expect(cookieJar.setCookie).not.to.have.been.called

      // send to browser anyway even though these will likely fail to be set
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie3=value3; SameSite=None')
    })

    it(`allows setting cookies if request type cannot be determined, but comes from the AUT frame (likely in the case of documents or redirects)`, async function () {
      const appendStub = sinon.stub()
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

      expect(cookieJar.setCookie).not.to.have.been.called

      // send to browser anyway even though these will likely fail to be set
      expect(appendStub).to.be.calledWith('Set-Cookie', 'cookie=value')
    })

    it('does not send cross:origin:cookies if request does not need top simulation', async () => {
      const { ctx } = prepareSameOriginContext()

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(ctx.serverBus.emit).not.to.be.called
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

      expect(ctx.serverBus.emit).not.to.be.called
    })

    it('sends cross:origin:cookies with origin and cookies if there are added cookies and resolves on cross:origin:cookies:received', async () => {
      const cookieJar = getCookieJarStub()

      cookieJar.getAllCookies.onCall(0).returns([])
      cookieJar.getAllCookies.onCall(1).returns([cookieStub({ key: 'cookie', value: 'value' })])

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

      // test will hang if this.next() is not called, so this also tests
      // that we move on once receiving this event
      ctx.serverBus.once.withArgs('cross:origin:cookies:received').yields()

      await testMiddleware([MaybeCopyCookiesFromIncomingRes], ctx)

      expect(ctx.serverBus.emit).to.be.calledWith('cross:origin:cookies')

      const cookies = ctx.serverBus.emit.withArgs('cross:origin:cookies').args[0][1]

      expect(cookies[0].name).to.equal('cookie')
      expect(cookies[0].value).to.equal('value')
    })

    function prepareContext (props) {
      const remoteStates = new RemoteStates(() => {})

      // set the primary remote state
      remoteStates.set('http://foobar.com')

      remoteStates.isPrimarySuperDomainOrigin = () => false

      const cookieJar = props.cookieJar || {
        getAllCookies: () => [],
        getCookies: () => [],
      }

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
        simulatedCookies: [],
      })

      return testMiddleware([MaybeInjectHtml], ctx)
      .then(() => {
        expect(htmlStub).to.be.calledOnce
        expect(htmlStub).to.be.calledWith('foo', {
          'cspNonce': undefined,
          'deferSourceMapRewrite': undefined,
          'domainName': 'foobar.com',
          'isNotJavascript': true,
          'modifyObstructiveCode': true,
          'modifyObstructiveThirdPartyCode': true,
          'shouldInjectDocumentDomain': true,
          'url': 'http://www.foobar.com:3501/primary-origin.html',
          'useAstSourceRewriting': undefined,
          'wantsInjection': 'full',
          'wantsSecurityRemoved': true,
          'simulatedCookies': [],
        })
      })
    })

    it('modifyObstructiveThirdPartyCode is false for primary requests', function () {
      prepareContext({
        simulatedCookies: [],
      })

      return testMiddleware([MaybeInjectHtml], ctx)
      .then(() => {
        expect(htmlStub).to.be.calledOnce
        expect(htmlStub).to.be.calledWith('foo', {
          'cspNonce': undefined,
          'deferSourceMapRewrite': undefined,
          'domainName': '127.0.0.1',
          'isNotJavascript': true,
          'modifyObstructiveCode': true,
          'modifyObstructiveThirdPartyCode': false,
          'shouldInjectDocumentDomain': true,
          'url': 'http://127.0.0.1:3501/primary-origin.html',
          'useAstSourceRewriting': undefined,
          'wantsInjection': 'full',
          'wantsSecurityRemoved': true,
          'simulatedCookies': [],
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
          experimentalSkipDomainInjection: null,
        },
        simulatedCookies: [],
      })

      return testMiddleware([MaybeInjectHtml], ctx)
      .then(() => {
        expect(htmlStub).to.be.calledOnce
        expect(htmlStub).to.be.calledWith('foo', {
          'cspNonce': undefined,
          'deferSourceMapRewrite': undefined,
          'domainName': 'foobar.com',
          'isNotJavascript': true,
          'modifyObstructiveCode': false,
          'modifyObstructiveThirdPartyCode': false,
          'shouldInjectDocumentDomain': true,
          'url': 'http://www.foobar.com:3501/primary-origin.html',
          'useAstSourceRewriting': undefined,
          'wantsInjection': 'full',
          'wantsSecurityRemoved': true,
          'simulatedCookies': [],
        })
      })
    })

    it('cspNonce is set to the value stored in res.injectionNonce', function () {
      prepareContext({
        req: {
          proxiedUrl: 'http://www.foobar.com:3501/primary-origin.html',
        },
        res: {
          injectionNonce: 'fake-nonce',
        },
        simulatedCookies: [],
      })

      return testMiddleware([MaybeInjectHtml], ctx)
      .then(() => {
        expect(htmlStub).to.be.calledOnce
        expect(htmlStub).to.be.calledWith('foo', {
          'cspNonce': 'fake-nonce',
          'deferSourceMapRewrite': undefined,
          'domainName': 'foobar.com',
          'isNotJavascript': true,
          'modifyObstructiveCode': true,
          'modifyObstructiveThirdPartyCode': true,
          'shouldInjectDocumentDomain': true,
          'url': 'http://www.foobar.com:3501/primary-origin.html',
          'useAstSourceRewriting': undefined,
          'wantsInjection': 'full',
          'wantsSecurityRemoved': true,
          'simulatedCookies': [],
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
          experimentalSkipDomainInjection: null,
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
          'isNotJavascript': true,
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
          'isNotJavascript': true,
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
          'isNotJavascript': true,
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
})
