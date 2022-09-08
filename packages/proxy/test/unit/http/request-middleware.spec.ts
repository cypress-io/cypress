import _ from 'lodash'
import RequestMiddleware from '../../../lib/http/request-middleware'
import { expect } from 'chai'
import { testMiddleware } from './helpers'
import { CypressIncomingRequest, CypressOutgoingResponse } from '../../../lib'
import { HttpBuffer, HttpBuffers } from '../../../lib/http/util/buffers'
import { RemoteStates } from '@packages/server/lib/remote_states'
import { CookieJar } from '@packages/server/lib/util/cookies'

describe('http/request-middleware', () => {
  it('exports the members in the correct order', () => {
    expect(_.keys(RequestMiddleware)).to.have.ordered.members([
      'LogRequest',
      'ExtractIsAUTFrameHeader',
      'MaybeAttachCrossOriginCookies',
      'MaybeEndRequestWithBufferedResponse',
      'CorrelateBrowserPreRequest',
      'SendToDriver',
      'InterceptRequest',
      'RedirectToClientRouteIfUnloaded',
      'EndRequestsToBlockedHosts',
      'StripUnsupportedAcceptEncoding',
      'MaybeSetBasicAuthHeaders',
      'SendRequestOutgoing',
    ])
  })

  describe('ExtractIsAUTFrameHeader', () => {
    const { ExtractIsAUTFrameHeader } = RequestMiddleware

    it('removes x-cypress-is-aut-frame header when it exists, sets in on the req', async () => {
      const ctx = {
        req: {
          headers: {
            'x-cypress-is-aut-frame': 'true',
          },
        } as Partial<CypressIncomingRequest>,
      }

      await testMiddleware([ExtractIsAUTFrameHeader], ctx)
      .then(() => {
        expect(ctx.req.headers['x-cypress-is-aut-frame']).not.to.exist
        expect(ctx.req.isAUTFrame).to.be.true
      })
    })

    it('removes x-cypress-is-aut-frame header when it does not exist, sets in on the req', async () => {
      const ctx = {
        req: {
          headers: {},
        } as Partial<CypressIncomingRequest>,
      }

      await testMiddleware([ExtractIsAUTFrameHeader], ctx)
      .then(() => {
        expect(ctx.req.headers['x-cypress-is-aut-frame']).not.to.exist
        expect(ctx.req.isAUTFrame).to.be.false
      })
    })
  })

  describe('MaybeAttachCrossOriginCookies', () => {
    const { MaybeAttachCrossOriginCookies } = RequestMiddleware

    it('is a noop if experimental flag is off', async () => {
      const ctx = await getContext()

      ctx.config.experimentalSessionAndOrigin = false

      await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

      expect(ctx.req.headers['cookie']).to.equal('request=cookie')
    })

    it('is a noop if no current AUT URL', async () => {
      const ctx = await getContext()

      ctx.getAUTUrl = () => ''

      await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

      expect(ctx.req.headers['cookie']).to.equal('request=cookie')
    })

    it('prepends cookie jar cookies to request', async () => {
      const ctx = await getContext()

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
              const ctx = await getContext(['jar=cookie', 'request=cookie'], ['jar=cookie1; Domain=app.foobar.com', 'jar=cookie2; Domain=foobar.com', 'jar=cookie3; Domain=exclude.foobar.com'], 'http://app.foobar.com/generic')

              await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

              expect(ctx.req.headers['cookie']).to.equal('jar=cookie1; jar=cookie2; request=cookie')
            })

            it('matches hierarchy and gives order to the cookie that was created first', async () => {
              const ctx = await getContext(['jar=cookie', 'request=cookie'], ['jar=cookie1; Domain=app.foobar.com;', 'jar=cookie2; Domain=.foobar.com;'], 'http://app.foobar.com/generic')

              const cookies = ctx.getCookieJar().getCookies('http://app.foobar.com/generic', 'strict')

              const TLDCookie = cookies.find((cookie) => cookie.domain === 'foobar.com')

              // make the TLD cookie created an hour earlier
              TLDCookie?.creation?.setHours(TLDCookie?.creation?.getHours() - 1)
              await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

              expect(ctx.req.headers['cookie']).to.equal('jar=cookie2; jar=cookie1; request=cookie')
            })

            it('matches hierarchy and gives order to the cookie with the most specific path, regardless of creation time', async () => {
              const ctx = await getContext(['jar=cookie', 'request=cookie'], ['jar=cookie1; Domain=app.foobar.com; Path=/generic', 'jar=cookie2; Domain=.foobar.com;'], 'http://app.foobar.com/generic')

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

          const ctx = await getContext(['request=cookie'], cookieJarCookies, 'http://app.foobar.com/generic/specific')

          const cookies = ctx.getCookieJar().getCookies('http://app.foobar.com/generic', 'strict')

          const TLDCookie = cookies.find((cookie) => cookie.domain === 'foobar.com')

          // make the TLD cookie created an hour earlier
          TLDCookie?.creation?.setHours(TLDCookie?.creation?.getHours() - 1)
          await testMiddleware([MaybeAttachCrossOriginCookies], ctx)

          expect(ctx.req.headers['cookie']).to.equal('jar=cookie7; jar=cookie8; jar=cookie5; jar=cookie4; jar=cookie1; jar=cookie2; request=cookie')
        })
      })
    })

    async function getContext (requestCookieStrings = ['request=cookie'], cookieJarStrings = ['jar=cookie'], autAndRequestUrl = 'http://foobar.com') {
      const cookieJar = new CookieJar()

      await Promise.all(cookieJarStrings.map(async (cookieString) => {
        try {
          await cookieJar._cookieJar.setCookie(cookieString, autAndRequestUrl)
        } catch (e) {
          // likely doesn't match the url policy, path, or is another type of cookie mismatch
          return
        }
      }))

      return {
        getAUTUrl: () => autAndRequestUrl,
        getCookieJar: () => cookieJar,
        config: { experimentalSessionAndOrigin: true },
        req: {
          proxiedUrl: autAndRequestUrl,
          isAUTFrame: true,
          headers: {

            cookie: requestCookieStrings.join('; '),
          },
        },
      }
    }
  })

  describe('MaybeEndRequestWithBufferedResponse', () => {
    const { MaybeEndRequestWithBufferedResponse } = RequestMiddleware

    it('sets wantsInjection to full when a request is buffered', async () => {
      const buffers = new HttpBuffers()
      const buffer = { url: 'https://www.cypress.io/', isCrossOrigin: false } as HttpBuffer

      buffers.set(buffer)

      const ctx = {
        buffers,
        req: {
          proxiedUrl: 'https://www.cypress.io/',
        },
        res: {} as Partial<CypressOutgoingResponse>,
      }

      await testMiddleware([MaybeEndRequestWithBufferedResponse], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('full')
      })
    })

    it('sets wantsInjection to fullCrossOrigin when a cross origin request is buffered', async () => {
      const buffers = new HttpBuffers()
      const buffer = { url: 'https://www.cypress.io/', isCrossOrigin: true } as HttpBuffer

      buffers.set(buffer)

      const ctx = {
        buffers,
        req: {
          proxiedUrl: 'https://www.cypress.io/',
        },
        res: {} as Partial<CypressOutgoingResponse>,
      }

      await testMiddleware([MaybeEndRequestWithBufferedResponse], ctx)
      .then(() => {
        expect(ctx.res.wantsInjection).to.equal('fullCrossOrigin')
      })
    })

    it('wantsInjection is not set when the request is not buffered', async () => {
      const buffers = new HttpBuffers()
      const buffer = { url: 'https://www.cypress.io/', isCrossOrigin: true } as HttpBuffer

      buffers.set(buffer)

      const ctx = {
        buffers,
        req: {
          proxiedUrl: 'https://www.not-cypress.io/',
        },
        res: {} as Partial<CypressOutgoingResponse>,
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
      const remoteStates = new RemoteStates(() => {})

      remoteStates.set('https://www.cypress.io/', { auth: { username: 'u', password: 'p' } })

      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          headers,
        },
        res: {} as Partial<CypressOutgoingResponse>,
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
      const remoteStates = new RemoteStates(() => {})

      remoteStates.set('https://cypress.io/', { auth: { username: 'u', password: 'p' } }) // does not match due to subdomain

      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          headers,
        },
        res: {} as Partial<CypressOutgoingResponse>,
        remoteStates,
      }

      await testMiddleware([MaybeSetBasicAuthHeaders], ctx)
      .then(() => {
        expect(ctx.req.headers['authorization']).to.be.undefined
      })
    })

    it('does not add auth header if remote does not have auth', async () => {
      const headers = {}
      const remoteStates = new RemoteStates(() => {})

      remoteStates.set('https://www.cypress.io/')

      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          headers,
        },
        res: {} as Partial<CypressOutgoingResponse>,
        remoteStates,
      }

      await testMiddleware([MaybeSetBasicAuthHeaders], ctx)
      .then(() => {
        expect(ctx.req.headers['authorization']).to.be.undefined
      })
    })

    it('does not add auth header if remote not found', async () => {
      const headers = {}
      const remoteStates = new RemoteStates(() => {})

      remoteStates.set('http://localhost:3500', { auth: { username: 'u', password: 'p' } })

      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          headers,
        },
        res: {} as Partial<CypressOutgoingResponse>,
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
      const remoteStates = new RemoteStates(() => {})

      remoteStates.set('https://www.cypress.io/', { auth: { username: 'u', password: 'p' } })

      const ctx = {
        req: {
          proxiedUrl: 'https://www.cypress.io/',
          headers,
        },
        res: {} as Partial<CypressOutgoingResponse>,
        remoteStates,
      }

      await testMiddleware([MaybeSetBasicAuthHeaders], ctx)
      .then(() => {
        expect(ctx.req.headers['authorization']).to.equal('token')
      })
    })
  })
})
