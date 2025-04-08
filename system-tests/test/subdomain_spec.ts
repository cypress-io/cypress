import cors from 'cors'
import parser from 'cookie-parser'
import session from 'express-session'
import systemTests from '../lib/system-tests'

const onServer = function (app) {
  app.use(parser())

  app.use((req, res, next) => {
    console.log('** REQUEST HEADERS ARE', req.url, req.headers)

    return next()
  })

  const getIndex = () => {
    return `\
<!DOCTYPE html>
<html>
<head>
</head>
<body>
<ul>
  <li>
    <a href="http://help.foobar.com:2292">switch to http://help.foobar.com</a>
  </li>
</ul>
</body>
</html>\
`
  }

  const getText = (text) => {
    return `\
<!DOCTYPE html>
<html>
<head>
</head>
<body>
<h1>${text}</h1>
</body>
</html>\
`
  }

  const applySession = session({
    name: 'secret-session',
    secret: 'secret',
    cookie: {
      sameSite: true,
    },
  }) as Function

  app.get('/htmlCookies', (req, res) => {
    const {
      cookie,
    } = req.headers

    return res.send(`<html><div id='cookie'>${cookie}</div></html>`)
  })

  app.get('/cookies*', cors({ origin: true, credentials: true }), (req, res) => {
    return res.json({
      cookie: req.headers['cookie'],
      parsed: req.cookie,
    })
  })

  app.get('/redirect', (req, res) => {
    return res.redirect('http://www.foobar.com:2292/cookies')
  })

  app.get('/domainRedirect', (req, res) => {
    return res.redirect('http://www.foobar.com:2292/htmlCookies')
  })

  return app.get('*', (req, res, next) => {
    res.set('Content-Type', 'text/html')

    const getHtml = () => {
      let h

      switch ((h = req.get('host'))) {
        case 'www.foobar.com:2292':
          return getIndex()

        case 'help.foobar.com:2292':
          return getText('Help')

        case 'session.foobar.com:2292':
          applySession(req, res, next)

          return getText('Session')

        case 'domain.foobar.com:2292':
          res.cookie('nomnom', 'good', {
            domain: '.domain.foobar.com',
          })

          return getText('Domain')

        case 'qa.sub.foobar.com:2292': case 'staging.sub.foobar.com:2292':
          return getText('Nested Subdomains')

        default:
          throw new Error(`Host: '${h}' not recognized`)
      }
    }

    return res.send(getHtml())
  })
}

describe('e2e subdomain w/ cy.origin and injectDocumentDomain disabled', () => {
  systemTests.setup({
    servers: {
      port: 2292,
      onServer,
    },
  })

  systemTests.it('passes', {
    browser: '!webkit', // TODO(webkit): fix+unskip
    spec: 'subdomain_origin.cy.js',
    snapshot: true,
    config: {
      hosts: {
        '*.foobar.com': '127.0.0.1',
      },
    },
  })
})
