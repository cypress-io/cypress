import systemTests from '../lib/system-tests'

const PORT = 44700

const onServer = (app) => {
  app.get('/', (req, res) => {
    res.type('html').send('<html><body><h1>http2 visit</h1></body></html>')
  })

  app.get('/protocol', (req, res) => {
    res.json({ protocol: req.httpVersion })
  })

  app.get('/fetch', (req, res) => {
    res.type('html').send(`\
<html>
  <body>
    <div id="result">loading</div>
    <script>
      fetch('/api/data')
        .then((res) => res.json())
        .then((body) => {
          document.getElementById('result').textContent = body.message
        })
    </script>
  </body>
</html>`)
  })

  app.get('/api/data', (req, res) => {
    res.json({ message: 'pong' })
  })

  app.get('/resources', (req, res) => {
    res.type('html').send(`\
<html>
  <head>
    <link rel="stylesheet" href="/resource.css" />
  </head>
  <body>
    <div id="script-loaded">pending</div>
    <div id="style-applied">styled</div>
    <script src="/resource.js"></script>
  </body>
</html>`)
  })

  app.get('/resource.js', (req, res) => {
    res.type('application/javascript').send(`document.getElementById('script-loaded').textContent = 'loaded'`)
  })

  app.get('/resource.css', (req, res) => {
    res.type('text/css').send(`#style-applied { color: red; }`)
  })

  app.get('/set-cookie', (req, res) => {
    res.setHeader('Set-Cookie', 'h2-cookie=set; Path=/')
    res.json({ ok: true })
  })
}

/**
 * HTTP/2 system test matrix.
 *
 * Phase 1 (active): With the MITM proxy enabled (`CYPRESS_INTERNAL_DISABLE_PROXY=0`),
 * every scenario must fail today because the proxy path does not support HTTP/2.
 *
 * Phase 2 (skipped): After CDP Fetch / BiDi interception lands, unskip the
 * `with proxy disabled` block — those runs use `CYPRESS_INTERNAL_DISABLE_PROXY=1`
 * and should pass with `expectedExitCode: 0`.
 */
const HTTP2_CASES = [
  { title: 'visit', spec: 'visit.cy.js' },
  { title: 'intercept spy', spec: 'intercept_spy.cy.js' },
  { title: 'intercept stub', spec: 'intercept_stub.cy.js' },
  { title: 'cy.request', spec: 'cy_request.cy.js' },
  { title: 'page resources', spec: 'page_resources.cy.js' },
  { title: 'cookies', spec: 'cookies.cy.js' },
] as const

const proxyEnabledEnv = {
  CYPRESS_INTERNAL_DISABLE_PROXY: '0',
}

const proxyDisabledEnv = {
  CYPRESS_INTERNAL_DISABLE_PROXY: '1',
}

const sharedRunOptions = {
  project: 'http2',
  browser: 'chrome' as const,
  port: PORT,
  config: {
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 15000,
  },
}

describe('e2e http2', () => {
  systemTests.setup({
    servers: [{
      port: PORT,
      http2: true,
      onServer,
    }],
    settings: {
      hosts: {
        '*.h2test.local': '127.0.0.1',
      },
      e2e: {
        allowCypressEnv: false,
      },
    },
  })

  describe('with MITM proxy enabled (CYPRESS_INTERNAL_DISABLE_PROXY=0)', () => {
    for (const { title, spec } of HTTP2_CASES) {
      systemTests.it(`fails: ${title}`, {
        ...sharedRunOptions,
        spec,
        processEnv: proxyEnabledEnv,
        expectedExitCode: 1,
      })
    }
  })

  // TODO: unskip when CDP Fetch / BiDi HTTP/2 interception is implemented
  describe.skip('with proxy disabled (CYPRESS_INTERNAL_DISABLE_PROXY=1)', () => {
    for (const { title, spec } of HTTP2_CASES) {
      systemTests.it(`passes: ${title}`, {
        ...sharedRunOptions,
        spec,
        processEnv: proxyDisabledEnv,
        expectedExitCode: 0,
      })
    }
  })
})
