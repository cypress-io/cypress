import _ from 'lodash'
import cookieParser from 'cookie-parser'

import e2e from '../support/helpers/e2e'

export const cookieServer = function (app) {
  app.use(cookieParser())

  app.get('/set', (req, res) => {
    const host = req.get('host')

    res.cookie(host, true)
    res.send('<div>set cookie</div>')
  })

  app.get('/timeout', (req, res) => {
    setTimeout(() => {
      res.set('Access-Control-Allow-Origin', '*')
      .end('it worked')
    }, req.query.ms)
  })

  app.get('/cookies*', (req, res) => {
    return res.send(_.map(req.cookies, (val, k) => `<div>${k}: ${val}</div>`).join('\n'))
  })

  app.get('*', (req, res) => {
    const host = req.get('host')

    const domain = host.slice(0, host.lastIndexOf(':'))

    switch (domain) {
      case '127.0.0.1':
        return res
        .cookie('1', true, {
          path: '/cookies/one',
          sameSite: 'lax',
        })
        .redirect(`http://${`${domain.slice(0, -1)}2`}:2290/`)

      case '127.0.0.2':
        return res
        .cookie('2', true, {
          path: '/cookies/two',
          sameSite: 'lax',
        })
        .redirect(`http://${`${domain.slice(0, -1)}3`}:2290/`)

      case '127.0.0.3':
        return res
        .set('Content-Type', 'text/html')
        .cookie('3', true, {
          path: '/cookies/three',
          sameSite: 'lax',
        })
        .send('<html><head></head><body>hi</body></html>')

      case '127.0.0.4':
        return res
        .cookie('4', true, {
          httpOnly: true,
          maxAge: 60000,
        })
        .cookie('2293-session', true)
        .send('<html><head></head><body>hi 2</body></html>')
      default:
        return res.send('<div>missed cases</div>')
    }
  })
}

describe('e2e requests', () => {
  e2e.setup({
    servers: [{
      port: 2290,
      onServer: cookieServer,
    }],
  })

  e2e.it.only('passes', {
    spec: 'session_spec.js',
    snapshot: true,
  })
})
