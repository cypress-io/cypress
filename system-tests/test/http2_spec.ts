import systemTests from '../lib/system-tests'
import { HTTP2_NATIVE_PORT, registerHttp2NativeRoutes } from './http2-native-routes'

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

  app.get('/api/item/:id', (req, res) => {
    const delayMs = Number(req.query.ms) || 0
    const id = Number(req.params.id)
    const body = JSON.stringify({ id })

    if (delayMs > 0) {
      return setTimeout(() => {
        res.type('json').send(body)
      }, delayMs)
    }

    res.type('json').send(body)
  })

  app.get('/multiplex', (req, res) => {
    res.type('html').send(`\
<html>
  <body>
    <div id="count">0</div>
    <div id="sum">0</div>
    <script>
      const total = 20
      let completed = 0
      let sum = 0

      for (let i = 0; i < total; i++) {
        fetch('/api/item/' + i)
          .then((res) => res.json())
          .then((body) => {
            completed += 1
            sum += body.id
            document.getElementById('count').textContent = String(completed)
            document.getElementById('sum').textContent = String(sum)
          })
      }
    </script>
  </body>
</html>`)
  })

  app.get('/multiplex-interleaved', (req, res) => {
    res.type('html').send(`\
<html>
  <body>
    <div id="order"></div>
    <script>
      const order = []

      function complete (id) {
        order.push(id)
        document.getElementById('order').textContent = order.join(',')
      }

      ;[0, 1, 2].forEach((id) => {
        fetch('/api/item/' + id + '?ms=300').then(() => complete(id))
      })

      ;[3, 4, 5].forEach((id) => {
        fetch('/api/item/' + id).then(() => complete(id))
      })
    </script>
  </body>
</html>`)
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
  { title: 'multiplex parallel fetch', spec: 'multiplex_parallel_fetch.cy.js' },
  { title: 'multiplex intercept', spec: 'multiplex_intercept.cy.js' },
  { title: 'multiplex interleaved', spec: 'multiplex_interleaved.cy.js' },
  // NOTE: Server push specs exercise Http2Stream.pushStream. Chrome is deprecating
  // HTTP/2 push in favor of preload and 103 Early Hints — see
  // https://developer.chrome.com/blog/removing-push — so Phase 2 may need a follow-up
  // fixture if push is no longer honored in CI Chrome.
  { title: 'server push', spec: 'server_push.cy.js' },
  { title: 'server push intercept', spec: 'server_push_intercept.cy.js' },
  { title: 'stream priority', spec: 'stream_priority.cy.js' },
  { title: 'settings', spec: 'settings.cy.js' },
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
    }, {
      port: HTTP2_NATIVE_PORT,
      http2: true,
      http2Native: true,
      onHttp2NativeServer: registerHttp2NativeRoutes,
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
