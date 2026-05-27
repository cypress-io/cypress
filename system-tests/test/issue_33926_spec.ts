import systemTests from '../lib/system-tests'

const stylesheetRoutes = [
  '/bundles/css-layer-order',
  '/bundles/libraries-css',
  '/bundles/common/content/common-css',
  '/bundles/main/content/main-css',
  '/acresi-vue-library/dist/assets/third-party-css',
]

const scriptRoutes = [
  '/bundles/acresi-vue-library/vendors.js',
  '/bundles/main.js',
]

const renderDashboard = (stress: boolean) => {
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
        fetch('/bundles/chunk-' + i + '.js?v=1').catch(() => {})
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
    <button data-cy="login-button" onclick="document.cookie='token=1; path=/'; location.href='/dashboard'">Login</button>
  </body>
</html>\
`)
  })

  app.get('/dashboard', (req, res) => {
    res.send(renderDashboard(false))
  })

  app.get('/dashboard-stress', (req, res) => {
    res.send(renderDashboard(true))
  })

  app.get('/keep_open', (req, res) => {
    // Intentionally never respond — keeps the AUT unstable (session_spec pattern).
  })

  app.get('/1mb', (req, res) => {
    res.type('text').send('x'.repeat(1024 * 1024))
  })

  for (const route of stylesheetRoutes) {
    app.get(route, (req, res) => {
      res.type('css').send('body { color: black; }')
    })
  }

  app.get('/bundles/acresi-vue-library/vendors.js', (req, res) => {
    res.type('js').send('window.__vendorLoaded = true')
  })

  app.get('/bundles/main.js', (req, res) => {
    const isStress = (req.get('referer') || '').includes('dashboard-stress')
    const delay = isStress ? 500 : 0

    setTimeout(() => {
      res.type('js').send(`\
document.body.insertAdjacentHTML('beforeend', '<div data-cy="nav-care-network">Care Network</div>');
window.__appMounted = true;
`)
    }, delay)
  })

  for (let i = 0; i < 20; i++) {
    app.get(`/bundles/chunk-${i}.js`, (req, res) => {
      res.type('js').send(`window.__chunkLoaded${i} = true`)
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
    expectedExitCode: 0,
    snapshot: true,
    onStdout (stdout) {
      const browserConnectFailure = stdout.includes('Timed out waiting for the browser to connect')
        || (stdout.includes('GET /__/') && !stdout.includes('GET /login'))
      const specExecuted = stdout.includes('issue 33926')
        && (stdout.includes('loads dashboard') || stdout.includes('beforeEach'))

      if (browserConnectFailure && !specExecuted) {
        throw new Error('WebKit timed out during browser connect (GET /__/ 404) before the spec ran — not a route repro failure')
      }
    },
  })
})
