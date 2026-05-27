import systemTests from '../lib/system-tests'

const stylesheetRoutes = [
  '/assets/layer',
  '/assets/style-a',
  '/assets/style-c',
  '/assets/style-b',
  '/assets/style-d',
]

const scriptRoutes = [
  '/assets/vendor.js',
  '/assets/app.js',
]

const renderAppPage = (stress: boolean) => {
  const stylesheets = stylesheetRoutes
  .map((route) => `<link rel="stylesheet" href="${route}?v=1">`)
  .join('\n')

  const scripts = scriptRoutes
  .map((route) => `<script src="${route}?v=1"></script>`)
  .join('\n')

  const stressScripts = stress ? `
    <script>
      fetch('/keep_open').catch(() => {})
      for (let i = 0; i < 50; i++) {
        fetch('/1mb?i=' + i).catch(() => {})
      }
    </script>
  ` : `
    <script>
      for (let i = 0; i < 20; i++) {
        fetch('/assets/chunk-' + i + '.js?v=1').catch(() => {})
      }
    </script>
  `

  return `\
<html>
  <head>
    ${stylesheets}
    ${stressScripts}
  </head>
  <body>
    ${scripts}
  </body>
</html>\
`
}

const onServer = (app) => {
  app.get('/login', (req, res) => {
    res.send(`\
<html>
  <body>
    <button id="sign-in" onclick="document.cookie='token=1; path=/'; location.href='/app'">Sign in</button>
  </body>
</html>\
`)
  })

  app.get('/app', (req, res) => {
    res.send(renderAppPage(false))
  })

  app.get('/dashboard', (req, res) => {
    res.redirect('/app')
  })

  app.get('/app-stress', (req, res) => {
    res.send(renderAppPage(true))
  })

  app.get('/keep_open', (req, res) => {
    // Intentionally never respond — keeps parallel fetches in-flight under stress.
  })

  app.get('/1mb', (req, res) => {
    res.type('text').send('x'.repeat(1024 * 1024))
  })

  for (const route of stylesheetRoutes) {
    app.get(route, (req, res) => {
      res.type('css').send('body { color: black; }')
    })
  }

  app.get('/assets/vendor.js', (req, res) => {
    const isStress = (req.get('referer') || '').includes('app-stress')

    // On the WebKit stress page, never respond — blocks load and reproduces
    // subresource hangs that leave the stability queue blocked post-#33446.
    if (isStress) {
      return
    }

    res.type('js').send('window.__vendorReady = true')
  })

  app.get('/assets/app.js', (req, res) => {
    const isStress = (req.get('referer') || '').includes('app-stress')
    const delay = isStress ? 500 : 0

    setTimeout(() => {
      res.type('js').send(`\
document.body.insertAdjacentHTML('beforeend', '<div id="app-root">Home</div>');
window.__mounted = true;
`)
    }, delay)
  })

  for (let i = 0; i < 20; i++) {
    app.get(`/assets/chunk-${i}.js`, (req, res) => {
      res.type('js').send(`window.__chunk${i} = true`)
    })
  }

  app.get('/api/config', (req, res) => {
    res.json({ ok: true })
  })
}

describe('e2e issue 33926', () => {
  systemTests.setup({
    servers: {
      port: 3500,
      onServer,
    },
    settings: {
      e2e: {
        baseUrl: 'http://localhost:3500',
      },
    },
  })

  // https://github.com/cypress-io/cypress/issues/33926
  // Suspected cause: https://github.com/cypress-io/cypress/pull/33446 (15.12.0)
  systemTests.it('passes on chrome', {
    browser: 'chrome',
    spec: 'issue_33926.cy.js',
    config: {
      experimentalWebKitSupport: true,
      testIsolation: false,
      defaultCommandTimeout: 5000,
      pageLoadTimeout: 10000,
    },
    expectedExitCode: 0,
  })

  systemTests.it('fails on webkit 15.15+ when session restore and intercepts deadlock stability queue', {
    browser: 'webkit',
    spec: 'issue_33926.cy.js',
    timeout: 60000,
    config: {
      experimentalWebKitSupport: true,
      testIsolation: false,
      defaultCommandTimeout: 5000,
      pageLoadTimeout: 10000,
    },
    expectedExitCode: 2,
    snapshot: true,
    onStdout (stdout) {
      const browserConnectFailure = stdout.includes('Timed out waiting for the browser to connect')
        || (stdout.includes('GET /__/') && !stdout.includes('GET /login'))
      const specExecuted = stdout.includes('issue 33926')
        && (stdout.includes('loads page') || stdout.includes('beforeEach'))

      if (browserConnectFailure && !specExecuted) {
        throw new Error('WebKit timed out during browser connect (GET /__/ 404) before the spec ran — not a route repro failure')
      }
    },
  })
})
