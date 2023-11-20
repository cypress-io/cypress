const _ = require('lodash')
const Bluebird = require('bluebird')
const cert = require('@packages/https-proxy/test/helpers/certs')
const https = require('https')
const useragent = require('express-useragent')
const { allowDestroy } = require('@packages/network')
const systemTests = require('../lib/system-tests').default

// create an HTTPS server that forces TLSv1
const startTlsV1Server = (port) => {
  return Bluebird.fromCallback((cb) => {
    const opts = _.merge({
      secureProtocol: 'TLSv1_server_method',
    }, cert)

    const serv = https.createServer(opts, (req, res) => {
      res.setHeader('content-type', 'text/html')

      return res.end('foo')
    })

    allowDestroy(serv)

    serv.listen(port, (err) => {
      return cb(null, serv)
    })

    return serv.on('error', cb)
  })
}

const onServer = function (app) {
  app.get('/agent.json', (req, res) => {
    const source = req.headers['user-agent'] != null ? req.headers['user-agent'] : ''

    const ua = useragent.parse(source)

    return res.send({ agent: ua })
  })

  app.get('/agent.html', (req, res) => {
    const source = req.headers['user-agent'] != null ? req.headers['user-agent'] : ''

    const ua = useragent.parse(source)

    return res.send(`\
<html>
  <a href='/agent.html'>agent</a>
  <div id="agent">
    ${JSON.stringify(ua)}
  </div>
</html\
`)
  })

  app.get('/headers.html', (req, res) => {
    return res.send(`\
<html>
<div id="headers">
  ${JSON.stringify(req.headers)}
</div>
</html>\
`)
  })

  app.get('/fail', (req, res) => {
    return res.sendStatus(500)
  })

  app.get('/timeout', (req, res) => {
    const ms = req.query.ms != null ? req.query.ms : 0

    return setTimeout(() => {
      return res.send(`<html>timeout: <span>${ms}</span></html>`)
    }
    , ms)
  })

  app.get('/response_never_finishes', (req, res) => {
    // dont ever end this response
    return res.type('html').write('foo\n')
  })

  // https://github.com/cypress-io/cypress/issues/5602
  app.get('/invalid-header-char', (req, res) => {
    // express/node may interfere if we just use res.setHeader
    res.connection.write(
      `\
HTTP/1.1 200 OK
Content-Type: text/html
Set-Cookie: foo=bar-${String.fromCharCode(1)}-baz

foo\
`,
    )

    return res.connection.end()
  })

  app.post('/redirect-post', (req, res) => {
    const code = Number(req.query.code)

    if (!code) {
      return res.end('no code supplied')
    }

    // 307 keeps the same HTTP method
    const url = code === 307 ? '/post-only' : '/timeout'

    res.redirect(code, url)
  })

  app.post('/post-only', (req, res) => {
    res.end('<html>it posted</html>')
  })
}

describe('e2e visit', () => {
  context('low response timeout', () => {
    systemTests.setup({
      settings: {
        responseTimeout: 500,
        pageLoadTimeout: 1000,
        e2e: {},
      },
      servers: {
        port: 3434,
        static: true,
        onServer,
      },
    })

    systemTests.it('passes', {
      browser: '!webkit', // TODO(webkit): fix+unskip
      spec: 'visit.cy.js',
      snapshot: true,
      onRun (exec) {
        return startTlsV1Server(6776)
        .then((serv) => {
          return exec()
          .finally(() => {
            return serv.destroy()
          })
        })
      },
    })

    systemTests.it('passes with experimentalSourceRewriting', {
      browser: '!webkit', // TODO(webkit): fix+unskip
      spec: 'source_rewriting.cy.js',
      config: {
        experimentalSourceRewriting: true,
      },
      snapshot: true,
      onRun (exec) {
        return startTlsV1Server(6776)
        .then((serv) => {
          return exec()
          .then(() => {
            return serv.destroy()
          })
        })
      },
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23252
    systemTests.it.skip('fails when network connection immediately fails', {
      spec: 'visit_http_network_error_failing.cy.js',
      snapshot: true,
      expectedExitCode: 1,
    })

    systemTests.it('fails when server responds with 500', {
      spec: 'visit_http_500_response_failing.cy.js',
      snapshot: true,
      expectedExitCode: 1,
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23162
    systemTests.it.skip('fails when file server responds with 404', {
      spec: 'visit_file_404_response_failing.cy.js',
      snapshot: true,
      expectedExitCode: 1,
    })

    systemTests.it('fails when content type isnt html', {
      spec: 'visit_non_html_content_type_failing.cy.js',
      snapshot: true,
      expectedExitCode: 1,
    })

    systemTests.it('calls onBeforeLoad when overwriting cy.visit', {
      snapshot: true,
      spec: 'issue_2196.cy.js',
    })
  })

  context('low responseTimeout, normal pageLoadTimeout', () => {
    systemTests.setup({
      settings: {
        responseTimeout: 2000,
        e2e: {},
      },
      servers: {
        port: 3434,
        static: true,
        onServer,
      },
    })

    systemTests.it('fails when response never ends', {
      spec: 'visit_response_never_ends_failing.cy.js',
      snapshot: true,
      expectedExitCode: 3,
    })
  })

  context('normal response timeouts', () => {
    systemTests.setup({
      settings: {
        pageLoadTimeout: 1000,
        e2e: {},
      },
      servers: {
        port: 3434,
        static: true,
        onServer,
      },
    })

    systemTests.it('fails when visit times out', {
      spec: 'visit_http_timeout_failing.cy.js',
      snapshot: true,
      expectedExitCode: 2,
    })
  })
})
