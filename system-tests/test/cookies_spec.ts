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
      env: {
        HTTP: httpPort,
        HTTPS: httpsPort,
      },
    },
    spec: 'multi_cookies.cy.js',
  })
})
