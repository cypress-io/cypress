const systemTests = require('../lib/system-tests').default

// Server that backs fetch.cy.js intercept tests
const onServer = function (app) {
  app.get('/first', (req, res) => {
    return res.send(`
      <html>
        <head><title>first</title></head>
        <body>
          <h1>first</h1>
          <a href="/second">second</a>
          <script>
            fetch('/get-json').then(r => r.json()).then(d => {
              document.body.innerHTML += '<div id="json">' + JSON.stringify(d) + '</div>'
            })
          </script>
        </body>
      </html>
    `)
  })

  app.get('/second', (req, res) => {
    return res.send(`
      <html>
        <head><title>second</title></head>
        <body>
          <h1>second</h1>
          <script>
            fetch('/get-text').then(r => r.text()).then(t => {
              document.body.innerHTML += '<div>text: ' + t + '</div>'
            })
          </script>
        </body>
      </html>
    `)
  })

  app.get('/addition', (req, res) => {
    return res.send(`
      <html>
        <head><title>addition</title></head>
        <body>
          <h1>addition</h1>
          <script>
            fetch('/add', { method: 'POST', body: JSON.stringify({ a: 7, b: 10 }), headers: { 'content-type': 'application/json' } })
              .then(r => r.json()).then(d => {
                document.body.innerHTML += '<div>answer: ' + d.answer + '</div>'
              })
          </script>
        </body>
      </html>
    `)
  })

  app.get('/get-json', (req, res) => {
    return res.json({ hello: 'world' })
  })

  app.get('/get-text', (req, res) => {
    return res.send('pong')
  })

  app.post('/add', (req, res) => {
    return res.json({ answer: 17 })
  })
}

describe('CDP network interception (proxy disabled)', () => {
  systemTests.setup({
    servers: {
      port: 1818,
      onServer,
    },
  })

  systemTests.it('passes all cy.intercept spy and stub assertions via CDP Fetch', {
    spec: 'fetch.cy.js',
    browser: 'chrome',
    processEnv: {
      CYPRESS_INTERNAL_DISABLE_PROXY: '1',
    },
    expectedExitCode: 0,
  })
})
