const systemTests = require('../lib/system-tests').default

// More parallel requests than WebKit's per-host connection pool (~6), all held
// by a function-handler intercept awaiting the driver. If the driver socket
// competed for that same pool, the `before:request` events would never reach
// the driver and every held request would deadlock.
const PARALLEL = 12

const html = `<!DOCTYPE html>
<html><body>
<div id="status">loading subresources...</div>
<script>
window.addEventListener('load', () => {
  let loaded = 0
  const done = () => {
    if (++loaded === ${PARALLEL}) {
      const el = document.createElement('div')
      el.id = 'done'
      document.body.appendChild(el)
    }
  }
  for (let i = 0; i < ${PARALLEL}; i++) {
    const script = document.createElement('script')
    script.src = '/subresource/' + i + '.js'
    script.onload = done
    script.onerror = done
    document.head.appendChild(script)
  }
})
</script>
</body></html>`

const onServer = (app) => {
  app.get('/', (req, res) => {
    res.send(html)
  })

  app.get('/subresource/:file', (req, res) => {
    setTimeout(() => {
      res.type('application/javascript').send('window.subresourceLoaded = true')
    }, 200)
  })
}

describe('e2e webkit parallel intercepted subresources', () => {
  systemTests.setup({
    servers: [{
      port: 3737,
      onServer,
    }],
  })

  systemTests.it('does not starve the driver socket when intercepted subresources exceed the connection pool', {
    browser: 'webkit',
    spec: 'webkit_parallel_intercepts.cy.js',
    config: {
      baseUrl: 'http://localhost:3737',
      // on failure the screenshot automation would also hang on the starved
      // socket, masking the real assertion error
      screenshotOnRunFailure: false,
    },
    snapshot: false,
    expectedExitCode: 0,
  })
})
