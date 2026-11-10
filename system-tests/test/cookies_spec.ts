/* eslint-disable no-restricted-properties */
import dayjs from 'dayjs'
import parser from 'cookie-parser'
import systemTests from '../lib/system-tests'
import humanInterval from 'human-interval'
import cors from 'cors'

const it = systemTests.it

const onServer = function (app) {
  app.use(parser())

  app.get('/', (req, res) => {
    return res.send('<html></html>')
  })

  app.get('/logout', (req, res) => {
    return res.send('<html>logged out</html>')
  })

  app.all('/requestCookies', (req, res) => {
    return res.send(req.cookies)
  })

  app.all('/requestCookiesHtml', (req, res) => {
    return res.type('html').send(req.cookies)
  })

  app.get('/set', (req, res) => {
    res.cookie('shouldExpire', 'endOfsession')

    return res.send('<html></html>')
  })

  app.get('/setOneHourFromNowAndSecure', (req, res) => {
    res.cookie('shouldExpire', 'oneHour', {
      secure: true,
      maxAge: humanInterval('1 hour'),
    })

    return res.send('<html></html>')
  })

  app.get('/expirationRedirect', (req, res) => {
    res.cookie('shouldExpire', 'now', {
      // express maxAge is relative to current time
      // in milliseconds
      maxAge: 0,
    })

    return res.redirect('/logout')
  })

  app.get('/expirationMaxAge', (req, res) => {
    res.header('Set-Cookie',
      'shouldExpire=; Max-Age=0; Path=/; Expires=Sun, 24 Jun 1997 20:36:13 GMT')
    // response to set
    // auth=p1_2FruNr1entizk9QEGHFYQlWjIK5LULzdDj17lkYhZTz7XA5GOfnVgbbeBDAqnfImkwof2qz0M3yi3AUVusKPqh1BRK6253h0kiBENwdjWDsx3mYQQKpHn6o3XOXX7poSkzrHThnrDlH4w9zoLItwIVNhR2hQrCYhQhtHuw20YM_3D; Domain=.surveymonkey.com;Max-Age=3600; Path=/; expires=Fri, 26-Oct-2018 06:13:48 GMT; secure; HttpOnly'

    // response to clear
    // auth=; Domain=.surveymonkey.com; Max-Age=0; Path=/; expires=Wed, 31-Dec-97 23:59:59 GMT

    return res.send('<html></html>')
  })

  app.get('/expirationExpires', (req, res) => {
    res.cookie('shouldExpire', 'now', {
      expires: dayjs().subtract(1, 'day').toDate(),
    })

    return res.send('<html></html>')
  })

  app.get('/cookieWithNoName', (req, res) => {
    res.header('Set-Cookie',
      '=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/')

    return res.send('<html></html>')
  })

  app.get('/invalidCookies', (req, res) => {
    res.header('Set-Cookie', 'foo=bar; domain=nope.not.this.one')

    return res.send('<html></html>')
  })

  app.get('/setCascadingCookies', (req, res) => {
    const n = Number(req.query.n)

    // alternates between base URLs
    const {
      a,
    } = req.query
    const {
      b,
    } = req.query

    res.header('Set-Cookie', [
      `namefoo${n}=valfoo${n}`,
      `namebar${n}=valbar${n}`,
    ])

    console.log('to', a, 'from', b)

    if (n > 0) {
      res.redirect(`${a}/setCascadingCookies?n=${n - 1}&a=${b}&b=${a}`)
    }

    return res.send('<html>finished setting cookies</html>')
  })

  app.get('/setDomainCookie', (req, res) => {
    res.setHeader('Set-Cookie', `domaincookie=foo; Domain=${req.query.domain}`)

    if (req.query.redirect) {
      return res.redirect(req.query.redirect).end()
    }

    return res.type('html').end()
  })

  app.get('/samesite/:value', (req, res) => {
    const { value } = req.params
    let header = `ss${value}=someval; Path=/; SameSite=${value}`

    if (value === 'None') {
      header += '; Secure'
    }

    res.setHeader('Set-Cookie', header)

    return res.type('html').end()
  })

  return app.get('/invalidControlCharCookie', (req, res) => {
    // `http` lib throws an error if we use .setHeader to set this
    return res.connection.end(`\
HTTP/1.1 200 OK
Content-Type: text/html
Set-Cookie: ___utmvaFvuoaRv=TkE\u0001sCvZ; path=/; Max-Age=900
Set-Cookie: _valid=true; path=/; Max-Age=900

foo\
`)
  })
}

const haveRoot = !process.env.USE_HIGH_PORTS && (process.geteuid() === 0)

if (!haveRoot) {
  console.warn('(e2e tests warning) You are not running as root; therefore, cookies_spec cannot cover the case where the default (80/443) HTTP(s) port is used. Alternate ports (2121/2323) will be used instead.')
}

let httpPort = 2121
let httpsPort = 2323

if (haveRoot) {
  httpPort = 80
  httpsPort = 443
}

const otherDomain = 'quux.bar.net'
const otherUrl = `http://${otherDomain}${haveRoot ? '' : `:${httpPort}`}`
const otherHttpsUrl = `https://${otherDomain}${haveRoot ? '' : `:${httpsPort}`}`

const FORCED_SAMESITE_ENV = {
  // SameSite is loosely enforced in Firefox
  FIREFOX_FORCE_STRICT_SAMESITE: 1,
}

const sharedBaseUrlSpecSnapshot = 'e2e cookies with baseurl'
const sharedNoBaseUrlSpecSnapshot = 'e2e cookies with no baseurl'

describe('e2e cookies', () => {
  systemTests.setup({
    servers: [{
      onServer,
      port: httpPort,
    }, {
      onServer,
      port: httpsPort,
      https: true,
    }],
    settings: {
      e2e: {},
      hosts: {
        '*.foo.com': '127.0.0.1',
        '*.bar.net': '127.0.0.1',
        '*.cypress.test': '127.0.0.1',
      },
    },
  })

  context('SameSite', () => {
    const baseUrl = `http://localhost${haveRoot ? '' : `:${httpPort}`}`

    // once browsers are shipping with the options in FORCED_SAMESITE_ENV as default,
    // we can remove this extra test case
    it('with forced SameSite strictness', {
      browser: '!webkit', // TODO(webkit): fix+unskip
      config: {
        baseUrl,
        env: {
          baseUrl,
          expectedDomain: 'localhost',
          https: false,
          httpUrl: baseUrl,
          httpsUrl: `https://localhost${haveRoot ? '' : `:${httpsPort}`}`,
          otherUrl,
          otherHttpsUrl,
        },
      },
      processEnv: FORCED_SAMESITE_ENV,
      spec: 'cookies_spec_baseurl.cy.js',
      snapshot: true,
      onRun: (exec) => {
        return exec({
          originalTitle: sharedBaseUrlSpecSnapshot,
        })
      },
    })
  })

  // this is a big chunky test that runs cookies_spec with all combinations of these:
  // - cookies on `localhost`, fully-qualified-domain-name, and IP address domains
  // - `https` baseurls, `http` baseurls, and no baseurls set
  // - both default port 80/443 and custom ports (if you are running as root)
  // - all browsers
  // snapshots are combined to ensure that there is no difference in any of these situations
  return [
    ['localhost', 'localhost'],
    ['FQDN', 'www.bar.foo.com'],
    ['private FQDN', 'local.cypress.test'],
    ['IP', '127.0.0.1'],
  ]
  .forEach(([
    format,
    baseDomain,
  ]) => {
    context(`with ${format} urls`, () => {
      const httpUrl = `http://${baseDomain}${haveRoot ? '' : `:${httpPort}`}`
      const httpsUrl = `https://${baseDomain}${haveRoot ? '' : `:${httpsPort}`}`;

      [
        [httpUrl, false],
        [httpsUrl, true],
      ].forEach((
        [
          baseUrl,
          https,
        ],
      ) => {
        it(`passes with baseurl: ${baseUrl}`, {
          browser: '!webkit', // TODO(webkit): fix+unskip
          config: {
            baseUrl,
            env: {
              baseUrl,
              expectedDomain: baseDomain,
              https,
              httpUrl,
              httpsUrl,
              otherUrl,
              otherHttpsUrl,
            },
          },
          spec: 'cookies_spec_baseurl.cy.js',
          snapshot: true,
          onRun: (exec) => {
            return exec({
              originalTitle: sharedBaseUrlSpecSnapshot,
            })
          },
        })
      })

      it('passes with no baseurl', {
        browser: '!webkit', // TODO(webkit): fix+unskip
        config: {
          env: {
            httpUrl,
            httpsUrl,
          },
        },
        originalTitle: sharedNoBaseUrlSpecSnapshot,
        spec: 'cookies_spec_no_baseurl.cy.js',
        snapshot: true,
      })
    })
  })
})

describe('cross-origin cookies, set:cookies', () => {
  const onServer = (app) => {
    app.use(parser())
    app.use(cors({
      origin: (origin, cb) => {
        cb(null, true)
      },
      credentials: true,
    }))

    app.get('/cookie/:name', (req, res) => {
      const name = req.params.name

      if (!name) {
        throw new Error('cookie options requires name')
      }

      const cookieStr = Object.keys(req.query)[0]

      const reqCookie = JSON.parse(cookieStr)

      const { value, ...cookie } = reqCookie

      res.cookie(name, value || 'value', {
        secure: true,
        sameSite: 'None',
        ...cookie,
      })

      res.send(`<h1>${name}</h1>`)
    })

    app.get('*', (req, res) => {
      res.json(req.cookies)
    })
  }

  systemTests.setup({
    servers: [{
      onServer,
      port: httpPort,
    }, {
      onServer,
      port: httpsPort,
      https: true,
    }],
    settings: {
      hosts: {
        '*.foo.com': '127.0.0.1',
        '*.bar.net': '127.0.0.1',
        '*.cypress.test': '127.0.0.1',
      },
      e2e: {},
    },

  })

  // https://github.com/cypress-io/cypress/issues/6375
  it('set:cookies', {
    browser: '!webkit', // TODO(webkit): fix+unskip (needs multidomain support)
    config: {
      baseUrl: `http://127.0.0.3:${httpPort}`,
      // NOTE: baseUrl 127.0.0.3 cookie verification fails on the browser (CDP) network path
      // for hosts/loopback reasons outside #34464
      forceHttp1: true,
      env: {
        HTTP: httpPort,
        HTTPS: httpsPort,
      },
    },
    spec: 'multi_cookies.cy.js',
  })
})

describe('cookie jar stays in sync after same-origin requests', () => {
  const onServer = (app) => {
    app.use(parser())

    // Renders the current value of the `flash` cookie. On the first visit (no
    // cookie yet) it seeds `flash=stale`, so the server-side cookie jar is
    // primed with a value via the navigation request.
    app.get('/stale_cookie', (req, res) => {
      const flash = req.cookies.flash

      if (!flash) {
        res.cookie('flash', 'stale')
      }

      return res
      .type('html')
      .send(`<html><body><div id="flash">flash: ${flash || 'stale'}</div></body></html>`)
    })

    // A same-origin XHR/fetch endpoint that updates the `flash` cookie to a
    // fresh value via Set-Cookie, mirroring an AJAX request that mutates a
    // cookie before the page is reloaded.
    app.post('/stale_cookie/update', (req, res) => {
      res.cookie('flash', 'fresh')

      return res.json({ ok: true })
    })
  }

  systemTests.setup({
    servers: [{
      onServer,
      port: httpPort,
    }],
    settings: {
      e2e: {},
    },
  })

  // https://github.com/cypress-io/cypress/issues/25841
  it('keeps the cookie jar in sync after a same-origin fetch or XHR updates a cookie', {
    browser: '!webkit', // TODO(webkit): fix+unskip (needs multidomain support)
    config: {
      baseUrl: `http://localhost:${httpPort}`,
    },
    spec: 'stale_cookie.cy.js',
  })
})

// https://github.com/cypress-io/cypress/issues/29719
describe('OAuth/SSO redirect-back cookie', () => {
  // Primary app (localhost:3500) — sets an oauth_state cookie on /oauth_login
  // and verifies it arrives at /oauth_callback after the IdP redirects back.
  const onPrimaryServer = (app) => {
    app.use(parser())

    app.get('/oauth_login', (req, res) => {
      // Set the CSRF state cookie on the first (primary-origin) page load.
      // This is the exact scenario fixed in #29719: the cookie is set on the
      // very first cy.visit when currentAUTUrl is still undefined.
      res.cookie('oauth_state', 'csrf-token-abc', { httpOnly: true })

      const idpUrl = `http://www.idp.com:${idpPort}/oauth_authorize?redirect_uri=${encodeURIComponent(`http://localhost:${primaryPort}/oauth_callback`)}`

      return res.type('html').send(`
        <html><body>
          <a data-cy="login-with-idp" href="${idpUrl}">Login with IdP</a>
        </body></html>
      `)
    })

    app.get('/oauth_callback', (req, res) => {
      // The proxy fix must re-attach the oauth_state cookie that the browser
      // drops on a cross-site iframe navigation.
      if (!req.cookies.oauth_state) {
        return res.type('html').send(`
          <html><body>
            <div data-cy="result">oauth login failed: missing state cookie</div>
          </body></html>
        `)
      }

      return res.type('html').send(`
        <html><body>
          <div data-cy="result">oauth login success</div>
        </body></html>
      `)
    })
  }

  // Mock IdP (www.idp.com:3501) — immediately server-side redirects back to
  // the primary origin callback without any user interaction required.
  const onIdpServer = (app) => {
    app.get('/oauth_authorize', (req, res) => {
      // Render a minimal page with a submit button so cy.origin can click it.
      // The button navigates to the callback via a server-side redirect.
      const redirectUri = req.query.redirect_uri

      return res.type('html').send(`
        <html><body>
          <form method="GET" action="/oauth_do_redirect">
            <input type="hidden" name="redirect_uri" value="${redirectUri}">
            <button data-cy="idp-submit" type="submit">Authorize</button>
          </form>
        </body></html>
      `)
    })

    app.get('/oauth_do_redirect', (req, res) => {
      // Server-side 302 back to the primary origin — this is the redirect that
      // previously caused the oauth_state cookie to be dropped.
      return res.redirect(302, req.query.redirect_uri)
    })
  }

  const primaryPort = 3500
  const idpPort = 3501

  systemTests.setup({
    servers: [{
      onServer: onPrimaryServer,
      port: primaryPort,
    }, {
      onServer: onIdpServer,
      port: idpPort,
    }],
    settings: {
      hosts: {
        '*.idp.com': '127.0.0.1',
      },
      e2e: {},
    },
  })

  it('sends primary-origin cookies set on the first visit through an IdP server-side redirect', {
    browser: '!webkit', // TODO(webkit): fix+unskip (needs multidomain support)
    config: {
      baseUrl: `http://localhost:${primaryPort}`,
    },
    spec: 'oauth_redirect_cookie.cy.js',
  })
})

describe('cookie jar stays in sync after cookies are set outside the proxy', () => {
  const onServer = (app) => {
    app.use(parser())

    // Renders the `sid` the server received, so a spec can assert on what arrived on
    // the wire rather than on what the browser believes it holds.
    const renderSid = (res, sid: string, extra = '') => {
      return res
      .type('html')
      .send(`<html><body><div id="sid">sid: ${sid || 'none'}</div>${extra}</body></html>`)
    }

    // Seeding `sid` on the first visit is what primes the server-side cookie jar,
    // since that navigation response is the one the proxy sees.
    app.get('/rotated_cookie', (req, res) => {
      const sid = req.cookies.sid || 'anon'

      if (!req.cookies.sid) {
        res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax' })
      }

      return renderSid(res, sid, '<a id="account" href="/rotated_cookie/account">account</a>')
    })

    // cy.request() issues this from Node, so the proxy never sees the Set-Cookie.
    app.post('/rotated_cookie/login', (req, res) => {
      res.cookie('sid', 'auth', { httpOnly: true, sameSite: 'lax' })

      return res.sendStatus(200)
    })

    app.get('/rotated_cookie/account', (req, res) => {
      return renderSid(res, req.cookies.sid)
    })
  }

  systemTests.setup({
    servers: [{
      onServer,
      port: httpPort,
    }],
    settings: {
      e2e: {},
    },
  })

  // https://github.com/cypress-io/cypress/issues/34891
  it('sends cookies set by cy.request and cy.setCookie on the next navigation', {
    browser: '!webkit', // TODO(webkit): fix+unskip
    config: {
      baseUrl: `http://localhost:${httpPort}`,
    },
    spec: 'rotated_cookie.cy.ts',
  })
})

// https://github.com/cypress-io/cypress/issues/34902
//
// Chrome applies a response's Set-Cookie headers before pausing it for Fetch
// interception, and neither continuing nor fulfilling the response undoes that.
// The browser's cookie store has to match the headers the handler leaves.
// Electron and Firefox stay on the HTTP proxy, which applies those headers itself.
describe('cy.intercept rewrites Set-Cookie headers', () => {
  const onServer = (app) => {
    app.use(parser())

    app.get('/cookie_sync/login', (req, res) => {
      res.cookie('session', 'plain', { path: '/' })

      return res.redirect('/cookie_sync/dashboard')
    })

    app.get('/cookie_sync/dashboard', (req, res) => {
      return res.type('html').send(`<html><body><div id="session">session: ${req.cookies.session || 'none'}</div></body></html>`)
    })

    // a redirect that revokes a session cookie the browser already holds
    app.get('/cookie_sync/revoke', (req, res) => {
      res.setHeader('Set-Cookie', 'session=; Max-Age=0; Path=/')

      return res.redirect('/cookie_sync/dashboard')
    })

    // overwrites a cookie on a path this request doesn't match
    app.get('/cookie_sync/other_path', (req, res) => {
      res.setHeader('Set-Cookie', 'scoped=origin; Path=/cookie_sync/elsewhere')

      return res.type('html').end()
    })

    app.get('/cookie_sync/domain', (req, res) => {
      res.setHeader('Set-Cookie', `a=origin; Domain=${req.query.domain}; Path=/`)

      return res.type('html').send('<html><body></body></html>')
    })

    app.get('/cookie_sync/plain', (req, res) => {
      res.setHeader('Set-Cookie', 'tracking=1; Path=/')

      return res.type('html').end()
    })

    // reached cross-site from the page, so Chrome blocks this SameSite=Lax cookie
    app.get('/cookie_sync/cross_site', (req, res) => {
      if (req.headers.origin) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
        res.setHeader('Access-Control-Allow-Credentials', 'true')
      }

      res.setHeader('Set-Cookie', 'tracking=1; Path=/; SameSite=Lax')

      return res.type('html').end()
    })

    // sets cookies, so a handler that also replaces the body fulfills the
    // response instead of continuing it
    app.get('/cookie_sync/page', (req, res) => {
      res.cookie('kept', 'origin', { path: '/' })
      res.cookie('dropped', 'origin', { path: '/' })

      return res.type('html').send('<html><body><div id="page">origin</div></body></html>')
    })

    app.get('/cookie_sync/no_cookies', (req, res) => {
      return res.type('html').send('<html><body></body></html>')
    })

    // Chrome refuses SameSite=None without Secure, so `blocked` never reaches the store
    app.get('/cookie_sync/blocked', (req, res) => {
      res.setHeader('Set-Cookie', ['blocked=1; Path=/; SameSite=None', 'kept=origin; Path=/'])

      return res.type('html').end()
    })

    // Chrome stores repeated=1 and refuses the SameSite=None repeated=2 that follows it
    app.get('/cookie_sync/blocked_repeat', (req, res) => {
      res.setHeader('Set-Cookie', ['repeated=1; Path=/', 'repeated=2; Path=/; SameSite=None'])

      return res.type('html').end()
    })

    // a spec rewrites req.url from /cookie_sync/original to this route on another
    // host, so /cookie_sync/original itself is never requested. Reached
    // cross-site from the page, so the cookies need SameSite=None and the
    // response needs credentialed CORS.
    app.get('/cookie_sync/rewritten', (req, res) => {
      if (req.headers.origin) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
        res.setHeader('Access-Control-Allow-Credentials', 'true')
      }

      res.setHeader('Set-Cookie', ['foo=origin; Path=/; SameSite=None; Secure', 'bar=origin; Path=/; SameSite=None; Secure'])

      return res.type('html').send('<html><body><div id="page">rewritten</div></body></html>')
    })
  }

  systemTests.setup({
    servers: [{
      onServer,
      port: httpPort,
    }],
    settings: {
      e2e: {},
      // co.uk is a public suffix, so Chrome stores a Domain=co.uk cookie
      // host-only. github.io would do too, but it is HSTS-preloaded.
      hosts: {
        '*.foo.com': '127.0.0.1',
        'co.uk': '127.0.0.1',
      },
    },
  })

  // chrome only: the CDP network path is Chromium-only, and Electron is
  // excluded from it (isBrowserNetworkMode). The opt-in full-suite forceHttp1
  // CI jobs export CYPRESS_forceHttp1=true; CLI config always beats env, so the
  // explicit `forceHttp1: false` pins this spec to the browser network path.
  it('keeps Set-Cookie changes a cy.intercept response handler makes, including across a redirect', {
    browser: 'chrome',
    config: {
      baseUrl: `http://localhost:${httpPort}`,
      forceHttp1: false,
    },
    spec: 'set_cookie_sync.cy.ts',
  })
})
