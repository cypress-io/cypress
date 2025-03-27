import _ from 'lodash'
import RequestMiddleware from '../../../lib/http/request-middleware'
import { expect } from 'chai'
import sinon from 'sinon'
import { testMiddleware } from './helpers'
import { CypressIncomingRequest, CypressOutgoingResponse } from '../../../lib'
import { HttpBuffer, HttpBuffers } from '../../../lib/http/util/buffers'
import { RemoteStates } from '@packages/server/lib/remote_states'
import { CookieJar } from '@packages/server/lib/util/cookies'
import { HttpMiddlewareThis } from '../../../lib/http'
import { DocumentDomainInjection } from '@packages/network'

describe('http/request-middleware', () => {
  const serverPort = 3030
  const fileServerPort = 3030

  const remoteStateConfig = () => {
    return { server: serverPort, fileServer: fileServerPort }
  }

  let remoteStates: RemoteStates
  let documentDomainInjection

  beforeEach(() => {
    documentDomainInjection = DocumentDomainInjection.InjectionBehavior({ injectDocumentDomain: false, testingType: 'e2e' })
    remoteStates = new RemoteStates(remoteStateConfig, documentDomainInjection)
  })

  it('exports the members in the correct order', () => {
    expect(_.keys(RequestMiddleware)).to.have.ordered.members([
      'LogRequest',
      'ExtractCypressMetadataHeaders',
      'MaybeSimulateSecHeaders',
      'CorrelateBrowserPreRequest',
      'CalculateCredentialLevelIfApplicable',
      'FormatCookiesIfApplicable',
      'MaybeAttachCrossOriginCookies',
      'MaybeEndRequestWithBufferedResponse',
      'SetMatchingRoutes',
      'SendToDriver',
      'InterceptRequest',
      'RedirectToClientRouteIfUnloaded',
      'EndRequestsToBlockedHosts',
      'StripUnsupportedAcceptEncoding',
      'MaybeSetBasicAuthHeaders',
      'SendRequestOutgoing',
    ])
  })

  describe('ExtractCypressMetadataHeaders', () => {
    const { ExtractCypressMetadataHeaders } = RequestMiddleware

    function prepareContext (headers = {}) {
      return {
        getAUTUrl: sinon.stub().returns('http://localhost:8080'),
        onlyRunMiddleware: sinon.stub(),
        remoteStates: {
          isPrimarySuperDomainOrigin: sinon.stub().returns(false),
        },
        req: {
          headers,
        } as Partial<CypressIncomingRequest>,
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }
    }

    context('x-cypress-is-aut-frame', () => {
      it('when it exists, removes header and sets in on the req', async () => {
        const ctx = prepareContext({
          'x-cypress-is-aut-frame': 'true',
        })

        await testMiddleware([ExtractCypressMetadataHeaders], ctx)
        .then(() => {
          expect(ctx.req.headers!['x-cypress-is-aut-frame']).not.to.exist
          expect(ctx.req.isAUTFrame).to.be.true
        })
      })

      it('when it does not exist, sets in on the req', async () => {
        const ctx = prepareContext()

        await testMiddleware([ExtractCypressMetadataHeaders], ctx).then(() => {
          expect(ctx.req.headers!['x-cypress-is-aut-frame']).not.to.exist
          expect(ctx.req.isAUTFrame).to.be.false
        })
      })
    })

    context('x-cypress-is-from-extra-target', () => {
      it('when it exists, sets in on the req and only runs necessary middleware', async () => {
        const ctx = prepareContext({
          'x-cypress-is-from-extra-target': 'true',
        })

        await testMiddleware([ExtractCypressMetadataHeaders], ctx)

        expect(ctx.req.headers!['x-cypress-is-from-extra-target']).not.to.exist
        expect(ctx.req.isFromExtraTarget).to.be.true
        expect(ctx['onlyRunMiddleware']).to.be.calledWith(['MaybeSetBasicAuthHeaders', 'SendRequestOutgoing'])
      })

      it('when it does not exist, removes header and sets in on the req', async () => {
        const ctx = prepareContext()

        await testMiddleware([ExtractCypressMetadataHeaders], ctx)

        expect(ctx.req.headers!['x-cypress-is-from-extra-target']).not.to.exist
        expect(ctx.req.isFromExtraTarget).to.be.false
      })
    })
  })

  describe('CalculateCredentialLevelIfApplicable', () => {
    const { CalculateCredentialLevelIfApplicable } = RequestMiddleware

    it('does not set credentialLevel on the request if top does NOT need to be simulated', async () => {
      const ctx = {
        getAUTUrl: sinon.stub().returns(undefined),
        req: {
          resourceType: 'xhr',
        } as Partial<CypressIncomingRequest>,
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([CalculateCredentialLevelIfApplicable], ctx)
      .then(() => {
        expect(ctx.req.credentialsLevel).not.to.exist
      })
    })

    it('does not set credentialLevel on the request if resourceType has invalid value', async () => {
      const ctx = {
        getAUTUrl: sinon.stub().returns('http://localhost:8080'),
        remoteStates: {
          isPrimarySuperDomainOrigin: sinon.stub().returns(false),
        },
        req: {
          resourceType: 'document',
        } as Partial<CypressIncomingRequest>,
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([CalculateCredentialLevelIfApplicable], ctx)
      .then(() => {
        expect(ctx.req.credentialsLevel).not.to.exist
      })
    })

    // CDP can determine whether or not the request is xhr | fetch, but the extension or electron cannot
    it('provides resourceTypeAndCredentialManager with resourceType if able to determine from prerequest (xhr)', async () => {
      const ctx = {
        getAUTUrl: sinon.stub().returns('http://localhost:8080'),
        remoteStates: {
          isPrimarySuperDomainOrigin: sinon.stub().returns(false),
        },
        resourceTypeAndCredentialManager: {
          get: sinon.stub().returns({}),
        },
        req: {
          resourceType: 'xhr',
          proxiedUrl: 'http://localhost:8080',
        } as Partial<CypressIncomingRequest>,
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([CalculateCredentialLevelIfApplicable], ctx)
      .then(() => {
        expect(ctx.resourceTypeAndCredentialManager.get).to.have.been.calledWith('http://localhost:8080', `xhr`)
      })
    })

    // CDP can determine whether or not the request is xhr | fetch, but the extension or electron cannot
    it('provides resourceTypeAndCredentialManager with resourceType if able to determine from prerequest (fetch)', async () => {
      const ctx = {
        getAUTUrl: sinon.stub().returns('http://localhost:8080'),
        remoteStates: {
          isPrimarySuperDomainOrigin: sinon.stub().returns(false),
        },
        resourceTypeAndCredentialManager: {
          get: sinon.stub().returns({}),
        },
        req: {
          resourceType: 'fetch',
          proxiedUrl: 'http://localhost:8080',
        } as Partial<CypressIncomingRequest>,
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([CalculateCredentialLevelIfApplicable], ctx)
      .then(() => {
        expect(ctx.resourceTypeAndCredentialManager.get).to.have.been.calledWith('http://localhost:8080', `fetch`)
      })
    })

    it('sets the resourceType and credentialsLevel on the request from whatever is returned by resourceTypeAndCredentialManager if conditions apply, assuming resourceType does NOT exist on the request', async () => {
      const ctx = {
        getAUTUrl: sinon.stub().returns('http://localhost:8080'),
        remoteStates: {
          isPrimarySuperDomainOrigin: sinon.stub().returns(false),
        },
        resourceTypeAndCredentialManager: {
          get: sinon.stub().returns({
            resourceType: 'fetch',
            credentialStatus: 'same-origin',
          }),
        },
        req: {
          resourceType: undefined,
          proxiedUrl: 'http://localhost:8080',
        } as Partial<CypressIncomingRequest>,
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([CalculateCredentialLevelIfApplicable], ctx)
      .then(() => {
        expect(ctx.req.resourceType).to.equal('fetch')
        expect(ctx.req.credentialsLevel).to.equal('same-origin')
      })
    })
  })

  describe('FormatCookiesIfApplicable', () => {
    const { FormatCookiesIfApplicable } = RequestMiddleware

    it('does nothing if "x-cypress-is-webdriver-bidi" header is not present', async () => {
      const ctx = {
        req: {
          headers: {
            cookie: 'foo=bar;bar=baz;qux=quux',
          },
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([FormatCookiesIfApplicable], ctx)

      expect(ctx.req.headers['cookie']).to.equal('foo=bar;bar=baz;qux=quux')
    })

    describe('header present', () => {
      it('does nothing if cookie header is already formatted correctly', async () => {
        const ctx = {
          req: {
            headers: {
              'x-cypress-is-webdriver-bidi': true,
              cookie: 'foo=bar; bar=baz; qux=quux',
            },
          },
          res: {
            on: (event, listener) => {},
            off: (event, listener) => {},
          },
        }

        await testMiddleware([FormatCookiesIfApplicable], ctx)

        expect(ctx.req.headers['cookie']).to.equal('foo=bar; bar=baz; qux=quux')
        expect(ctx.req.headers!['x-cypress-is-webdriver-bidi']).not.to.exist
      })

      it('delimits cookie headers by "; " if no space exists between cookie values', async () => {
        const ctx = {
          req: {
            headers: {
              'x-cypress-is-webdriver-bidi': true,
              cookie: 'foo=bar;bar=baz;qux=quux',
            },
          },
          res: {
            on: (event, listener) => {},
            off: (event, listener) => {},
          },
        }

        await testMiddleware([FormatCookiesIfApplicable], ctx)

        expect(ctx.req.headers['cookie']).to.equal('foo=bar; bar=baz; qux=quux')
        expect(ctx.req.headers!['x-cypress-is-webdriver-bidi']).not.to.exist
      })
    })
  })

  describe('MaybeSimulateSecHeaders', () => {
    const { MaybeSimulateSecHeaders } = RequestMiddleware

    it('is a noop if experimental modify third party code is off', async () => {
      const ctx = {
        config: {
          experimentalModifyObstructiveThirdPartyCode: false,
        },
        req: {
          headers: {
            'sec-fetch-dest': 'iframe',
          },
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([MaybeSimulateSecHeaders], ctx)

      expect(ctx.req.headers['sec-fetch-dest']).to.equal('iframe')
    })

    it('is a noop if the request is not the AUT Frame', async () => {
      const ctx = {
        config: {
          experimentalModifyObstructiveThirdPartyCode: true,
        },
        req: {
          isAUTFrame: false,
          headers: {
            'sec-fetch-dest': 'iframe',
          },
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([MaybeSimulateSecHeaders], ctx)

      expect(ctx.req.headers['sec-fetch-dest']).to.equal('iframe')
    })

    it('is a noop if the request is the AUT Frame, but the sec-fetch-dest isn\t an iframe', async () => {
      const ctx = {
        config: {
          experimentalModifyObstructiveThirdPartyCode: true,
        },
        req: {
          isAUTFrame: true,
          headers: {
            'sec-fetch-dest': 'video',
          },
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([MaybeSimulateSecHeaders], ctx)

      expect(ctx.req.headers['sec-fetch-dest']).to.equal('video')
    })

    it('rewrites the sec-fetch-dest header if the experimental modify third party code is enabled, the request came from the AUT frame, and is an iframe', async () => {
      const ctx = {
        config: {
          experimentalModifyObstructiveThirdPartyCode: true,
        },
        req: {
          isAUTFrame: true,
          headers: {
            'sec-fetch-dest': 'iframe',
          },
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      }

      await testMiddleware([MaybeSimulateSecHeaders], ctx)

      expect(ctx.req.headers['sec-fetch-dest']).to.equal('document')
    })
  })

  describe('MaybeAttachCrossOriginCookies', () => {
    const { MaybeAttachCrossOriginCookies } = RequestMiddleware

    it('is a noop if no current AUT URL', async () => {
      const ctx = await getContext()

      ctx.getAUTUrl = () => ''

      await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

      expect(ctx.req.headers['cookie']).to.equal('request=cookie')
    })

    it('is a noop if does not need to simulate top', async () => {
      const ctx = await getContext()

      ctx.req.isAUTFrame = false
      ctx.remoteStates.isPrimarySuperDomainOrigin.returns(true),

      await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

      expect(ctx.req.headers['cookie']).to.equal('request=cookie')
    })

    it('is a noop if cookies do NOT need to be attached to request', async () => {
      const ctx = await getContext(['request=cookie'], ['jar=cookie'], 'http://foobar.com', 'http://app.foobar.com')

      ctx.req.resourceType = 'fetch'
      ctx.req.credentialsLevel = 'omit'

      await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

      expect(ctx.req.headers['cookie']).to.equal('request=cookie')
    })

    it(`allows setting cookies on request if resource type cannot be determined, but comes from the AUT frame (likely in the case of documents or redirects)`, async function () {
      const ctx = await getContext([], ['jar=cookie'], 'http://foobar.com/index.html', 'http://app.foobar.com/index.html')

      ctx.req.resourceType = undefined
      ctx.req.credentialsLevel = undefined
      ctx.req.isAUTFrame = true
      await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

      expect(ctx.req.headers['cookie']).to.equal('jar=cookie')
    })

    it(`otherwise, does not allow setting cookies if request type cannot be determined and is not from the AUT and is cross-origin`, async function () {
      const ctx = await getContext([], ['jar=cookie'], 'http://foobar.com/index.html', 'http://app.foobar.com/index.html')

      ctx.req.resourceType = undefined
      ctx.req.credentialsLevel = undefined
      ctx.req.isAUTFrame = false
      await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

      expect(ctx.req.headers['cookie']).to.be.undefined
    })

    it('sets the cookie header to undefined if no cookies exist on the request, none in the jar, but cookies should be attached', async () => {
      const ctx = await getContext([], [], 'http://foobar.com', 'http://app.foobar.com')

      ctx.req.resourceType = 'xhr'
      ctx.req.credentialsLevel = true

      await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

      expect(ctx.req.headers['cookie']).to.equal(undefined)
    })

    it('prepends cookie jar cookies to request', async () => {
      const ctx = await getContext(['request=cookie'], ['jar=cookie'], 'http://foobar.com', 'http://app.foobar.com')

      ctx.req.resourceType = 'fetch'
      ctx.req.credentialsLevel = 'include'

      await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

      expect(ctx.req.headers['cookie']).to.equal('jar=cookie; request=cookie')
    })

    // @see https://github.com/cypress-io/cypress/issues/22751
    it('does not double up cookies on request if the cookie exists on the request and in the cookie jar', async () => {
      const ctx = await getContext(['jar=cookie', 'request=cookie'])

      await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

      expect(ctx.req.headers['cookie']).to.equal('jar=cookie; request=cookie')
    })

    describe('tough-cookie integration', () => {
      /**
     * Depending on how cookies are defined, they need to be specified in order of most specific PATH matching to least specific PATH matching
     * @see https://www.rfc-editor.org/rfc/rfc6265#section-5.4.
     *
     * If PATH is equal, cookies with earlier creation-times are listed before cookies with later creation-times
     *
     * If cookies of the same key are defined on different domains, both of which match the domain policy,
     * and the path is the same, both cookies are included but are not ordered by specific domain
     *
     * Take the following example:
     *
     * KEY | VALUE | DOMAIN                | PATH
     * foo | bar1  | subdomain.example.com | /
     * foo | bar2  | .example.com          | /
     * foo | bar3  | myapp.example.com     | /
     * foo | bar4  | subdomain.example.com | /generic-path
     * foo | bar5  | .example.com          | /generic-path
     * foo | bar6  | myapp.example.com     | /generic-path
     * foo | bar7  | subdomain.example.com | /generic-path/specific-path
     * foo | bar8  | .example.com          | /generic-path/specific-path
     * foo | bar9  | myapp.example.com     | /generic-path/specific-path
     *
     * A request to subdomain.example.com/generic-path/specific-path should have the cookies listed in the following order.
     * foo=bar7|bar8 foo=bar5|bar4 foo=bar2|bar1
     *
     * A request to subdomain.example.com/generic-path should have the cookies listed in the following order.
     * foo=bar5|bar4 foo=bar2|bar1
     *
     * A request to subdomain.example.com/, assuming foo=bar1 was created before foo=bar2, should have the cookies listed in the following order.
     * foo=bar1 foo=bar2
     *
     * Thankfully, tough-cookie handles most of this for us.
     * These tests are to leverage small integration tests between us and tough-cookie to make sure we are adding cookies correctly to the Cookie header given the above circumstances
     */
      describe('duplicate cookies', () => {
        describe('does not add request cookie to request if cookie exists in jar, and preserves duplicate cookies when same key/value if', () => {
          describe('subdomain and TLD', () => {
            it('matches hierarchy', async () => {
              const ctx = await getContext(['jar=cookie', 'request=cookie'], ['jar=cookie1; Domain=app.foobar.com', 'jar=cookie2; Domain=foobar.com', 'jar=cookie3; Domain=exclude.foobar.com'], 'http://app.foobar.com/generic', 'http://app.foobar.com/generic')

              await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

              expect(ctx.req.headers['cookie']).to.equal('jar=cookie1; jar=cookie2; request=cookie')
            })

            it('matches hierarchy and gives order to the cookie that was created first', async () => {
              const ctx = await getContext(['jar=cookie', 'request=cookie'], ['jar=cookie1; Domain=app.foobar.com;', 'jar=cookie2; Domain=.foobar.com;'], 'http://app.foobar.com/generic', 'http://app.foobar.com/generic')

              const cookies = ctx.getCookieJar().getCookies('http://app.foobar.com/generic', 'strict')

              const TLDCookie = cookies.find((cookie) => cookie.domain === 'foobar.com')

              // make the TLD cookie created an hour earlier
              TLDCookie?.creation?.setHours(TLDCookie?.creation?.getHours() - 1)
              await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

              expect(ctx.req.headers['cookie']).to.equal('jar=cookie2; jar=cookie1; request=cookie')
            })

            it('matches hierarchy and gives order to the cookie with the most specific path, regardless of creation time', async () => {
              const ctx = await getContext(['jar=cookie', 'request=cookie'], ['jar=cookie1; Domain=app.foobar.com; Path=/generic', 'jar=cookie2; Domain=.foobar.com;'], 'http://app.foobar.com/generic', 'http://app.foobar.com/generic')

              const cookies = ctx.getCookieJar().getCookies('http://app.foobar.com/generic', 'strict')

              const TLDCookie = cookies.find((cookie) => cookie.domain === 'foobar.com')

              // make the TLD cookie created an hour earlier
              TLDCookie?.creation?.setHours(TLDCookie?.creation?.getHours() - 1)
              await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

              expect(ctx.req.headers['cookie']).to.equal('jar=cookie1; jar=cookie2; request=cookie')
            })
          })
        })

        it('omits cookies not fitting the cookie policy of the request', async () => {
          const cookieJarCookies = [
            'jar=cookie1; Domain=app.foobar.com; Path=/',
            'jar=cookie2; Domain=.foobar.com; Path=/',
            'jar=cookie3; Domain=exclude.foobar.com; Path=/',
            'jar=cookie4; Domain=app.foobar.com; Path=/generic',
            'jar=cookie5; Domain=.foobar.com; Path=/generic',
            'jar=cookie6; Domain=exclude.foobar.com; Path=/generic',
            'jar=cookie7; Domain=app.foobar.com; Path=/generic/specific',
            'jar=cookie8; Domain=.foobar.com; Path=/generic/specific',
            'jar=cookie9; Domain=exclude.foobar.com; Path=/generic/specific',
          ]

          const ctx = await getContext(['request=cookie'], cookieJarCookies, 'http://app.foobar.com/generic/specific', 'http://app.foobar.com/generic/specific')

          const cookies = ctx.getCookieJar().getCookies('http://app.foobar.com/generic', 'strict')

          const TLDCookie = cookies.find((cookie) => cookie.domain === 'foobar.com')

          // make the TLD cookie created an hour earlier
          TLDCookie?.creation?.setHours(TLDCookie?.creation?.getHours() - 1)
          await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

          expect(ctx.req.headers['cookie']).to.equal('jar=cookie7; jar=cookie8; jar=cookie5; jar=cookie4; jar=cookie1; jar=cookie2; request=cookie')
        })
      })
    })

    async function getContext (requestCookieStrings = ['request=cookie'], cookieJarStrings = ['jar=cookie'], autUrl = 'http://foobar.com', requestUrl = 'http://foobar.com') {
      const cookieJar = new CookieJar()

      await Promise.all(cookieJarStrings.map(async (cookieString) => {
        try {
          await cookieJar._cookieJar.setCookie(cookieString, requestUrl)
        } catch (e) {
          // likely doesn't match the url policy, path, or is another type of cookie mismatch
          return
        }
      }))

      return {
        getAUTUrl: () => autUrl,
        getCookieJar: () => cookieJar,
        remoteStates: {
          isPrimarySuperDomainOrigin: sinon.stub().returns(false),
        },
        req: {
          proxiedUrl: requestUrl,
          isAUTFrame: true,
          headers: {
            cookie: requestCookieStrings.join('; ') || undefined,
          },
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        },
      } as HttpMiddlewareThis<any>
    }
  })

  describe('MaybeEndRequestWithBufferedResponse', () => {
    const { MaybeEndRequestWithBufferedResponse } = RequestMiddleware

    it('sets wantsInjection to full when a request is buffered', async () => {
      const buffers = new HttpBuffers()
      const buffer = { url: 'https://www.cypress.io/', urlDoesNotMatchPolicyBasedOnDomain: false } as HttpBuffer

      buffers.set(buffer)

      const ctx = {
        buffers,
        req: {
          proxiedUrl: 'https://www.cypress.io/',
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        } as Partial<CypressOutgoingResponse>,
      }

      await testMiddleware([MaybeEndRequestWithBufferedResponse], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('full')
      })
    })

    it('sets wantsInjection to fullCrossOrigin when a cross origin request is buffered', async () => {
      const buffers = new HttpBuffers()
      const buffer = { url: 'https://www.cypress.io/', urlDoesNotMatchPolicyBasedOnDomain: true } as HttpBuffer

      buffers.set(buffer)

      const ctx = {
        buffers,
        req: {
          proxiedUrl: 'https://www.cypress.io/',
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        } as Partial<CypressOutgoingResponse>,
      }

      await testMiddleware([MaybeEndRequestWithBufferedResponse], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('fullCrossOrigin')
      })
    })

    it('wantsInjection is not set when the request is not buffered', async () => {
      const buffers = new HttpBuffers()
      const buffer = { url: 'https://www.cypress.io/', urlDoesNotMatchPolicyBasedOnDomain: true } as HttpBuffer

      buffers.set(buffer)

      const ctx = {
        buffers,
        req: {
          proxiedUrl: 'https://www.not-cypress.io/',
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        } as Partial<CypressOutgoingResponse>,
      }

      await testMiddleware([MaybeEndRequestWithBufferedResponse], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.be.undefined
      })
    })
  })

  describe('MaybeSetBasicAuthHeaders', () => {
    const { MaybeSetBasicAuthHeaders } = RequestMiddleware

    it('adds auth header from remote state', async () => {
      const headers = {}

      remoteStates.set('https://www.cypress.io/', { auth: { username: 'u', password: 'p' } })

      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          headers,
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        } as Partial<CypressOutgoingResponse>,
        remoteStates,
      }

      await testMiddleware([MaybeSetBasicAuthHeaders], ctx)
      .then(() => {
        const expectedAuthHeader = `Basic ${Buffer.from('u:p').toString('base64')}`

        expect(ctx.req.headers['authorization']).to.equal(expectedAuthHeader)
      })
    })

    it('does not add auth header if origins do not match', async () => {
      const headers = {}

      remoteStates.set('https://cypress.io/', { auth: { username: 'u', password: 'p' } }) // does not match due to subdomain

      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          headers,
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        } as Partial<CypressOutgoingResponse>,
        remoteStates,
      }

      await testMiddleware([MaybeSetBasicAuthHeaders], ctx)
      .then(() => {
        expect(ctx.req.headers['authorization']).to.be.undefined
      })
    })

    it('does not add auth header if remote does not have auth', async () => {
      const headers = {}

      remoteStates.set('https://www.cypress.io/')

      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          headers,
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        } as Partial<CypressOutgoingResponse>,
        remoteStates,
      }

      await testMiddleware([MaybeSetBasicAuthHeaders], ctx)
      .then(() => {
        expect(ctx.req.headers['authorization']).to.be.undefined
      })
    })

    it('does not add auth header if remote not found', async () => {
      const headers = {}

      remoteStates.set('http://localhost:3500', { auth: { username: 'u', password: 'p' } })

      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          headers,
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        } as Partial<CypressOutgoingResponse>,
        remoteStates,
      }

      await testMiddleware([MaybeSetBasicAuthHeaders], ctx)
      .then(() => {
        expect(ctx.req.headers['authorization']).to.be.undefined
      })
    })

    it('does not update auth header from remote if request already has auth', async () => {
      const headers = {
        authorization: 'token',
      }

      remoteStates.set('https://www.cypress.io/', { auth: { username: 'u', password: 'p' } })

      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          headers,
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        } as Partial<CypressOutgoingResponse>,
        remoteStates,
      }

      await testMiddleware([MaybeSetBasicAuthHeaders], ctx)
      .then(() => {
        expect(ctx.req.headers['authorization']).to.equal('token')
      })
    })
  })

  describe('CorrelateBrowserPreRequest', () => {
    const { CorrelateBrowserPreRequest } = RequestMiddleware

    it('skips if shouldCorrelatePreRequests returns false', async () => {
      const ctx = {
        res: {
          off: sinon.stub(),
        },
        shouldCorrelatePreRequests: () => false,
        getPreRequest: sinon.stub(),
      }

      await testMiddleware([CorrelateBrowserPreRequest], ctx)
      .then(() => {
        expect(ctx.getPreRequest).not.to.be.called
      })
    })

    it('sets browserPreRequest on the request', async () => {
      const browserPreRequest = sinon.stub()

      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          browserPreRequest: undefined,
          headers: [],
        },
        res: {
          off: sinon.stub(),
          once: sinon.stub(),
        },
        shouldCorrelatePreRequests: () => true,
        getPreRequest: sinon.stub().yields({
          browserPreRequest,
        }),
      }

      await testMiddleware([CorrelateBrowserPreRequest], ctx)
      .then(() => {
        expect(ctx.getPreRequest).to.be.calledOnce
        expect(ctx.req.browserPreRequest).to.equal(browserPreRequest)
        expect(ctx.res.once).to.be.calledWith('close')
        expect(ctx.res.off).to.be.calledWith('close')
      })
    })

    it('sets noPreRequestExpected on the request', async () => {
      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          browserPreRequest: undefined,
          noPreRequestExpected: undefined,
          headers: [],
        },
        res: {
          off: sinon.stub(),
          once: sinon.stub(),
        },
        shouldCorrelatePreRequests: () => true,
        getPreRequest: sinon.stub().yields({
          noPreRequestExpected: true,
        }),
      }

      await testMiddleware([CorrelateBrowserPreRequest], ctx)
      .then(() => {
        expect(ctx.getPreRequest).to.be.calledOnce
        expect(ctx.req.noPreRequestExpected).to.be.true
        expect(ctx.res.once).to.be.calledWith('close')
        expect(ctx.res.off).to.be.calledWith('close')
      })
    })

    it('errors when the request is destroyed prior to receiving a pre-request', () => {
      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          destroyed: true,
          browserPreRequest: undefined,
          noPreRequestExpected: undefined,
          headers: [],
        },
        res: {
          off: sinon.stub(),
          once: sinon.stub(),
        },
        shouldCorrelatePreRequests: () => true,
        getPreRequest: sinon.stub(),
        onError: sinon.stub(),
      }

      testMiddleware([CorrelateBrowserPreRequest], ctx)
      ctx.res.once.callArg(1)

      expect(ctx.getPreRequest).to.be.calledOnce
      expect(ctx.req.noPreRequestExpected).to.be.undefined
      expect(ctx.req.browserPreRequest).to.be.undefined
      expect(ctx.res.once).to.be.calledWith('close')
      expect(ctx.onError).to.be.calledOnce
    })
  })

  describe('SendRequestOutgoing', () => {
    const { SendRequestOutgoing } = RequestMiddleware

    let ctx

    beforeEach(() => {
      const headers = {}

      ctx = {
        onError: sinon.stub(),
        request: {
          create: (opts) => {
            return {
              inputArgs: opts,
              on: (event, callback) => {
                if (event === 'response') {
                  callback({ request: { timings: {} } })
                }
              },
            }
          },
        },
        req: {
          body: '{}',
          headers,
          socket: {
            on: () => {},
          },
        },
        res: {
          on: (event, listener) => {},
          off: (event, listener) => {},
        } as Partial<CypressOutgoingResponse>,
        remoteStates,
      }
    })

    context('same-origin file request', () => {
      beforeEach(() => {
        ctx.getFileServerToken = () => 'abcd1234'
        ctx.req.proxiedUrl = 'https://www.cypress.io/file'
        ctx.remoteStates.set({
          origin: 'https://www.cypress.io',
          strategy: 'file',
        } as any)
      })

      it('adds `x-cypress-authorization` header', async () => {
        await testMiddleware([SendRequestOutgoing], ctx)
        .then(() => {
          expect(ctx.req.headers['x-cypress-authorization']).to.equal('abcd1234')
        })
      })

      it('handles nil fileServer token', async () => {
        ctx.getFileServerToken = () => undefined

        await testMiddleware([SendRequestOutgoing], ctx)
        .then(() => {
          expect(ctx.req.headers['x-cypress-authorization']).to.be.undefined
        })
      })
    })
  })
})
