const fs = require('fs')
const Fixtures = require('../lib/fixtures')
const systemTests = require('../lib/system-tests').default

const onServer = function (app) {
  app.get('/index.html', (req, res) => {
    return res.send(`\
<html>
<body>
  some bad js a comin'
</body>
</html>\
`)
  })

  app.get('/gzip-bad.html', (req, res) => {
    const buf = fs.readFileSync(Fixtures.path('server/gzip-bad.html.gz'))

    return res.set({
      'content-type': 'text/html',
      'content-encoding': 'gzip',
    })
    .send(buf)
  })

  return app.get('/gzip-bad.js', (req, res) => {
    const buf = fs.readFileSync(Fixtures.path('server/gzip-bad.html.gz'))

    return res.set({
      'content-type': 'text/javascript',
      'content-encoding': 'gzip',
    })
    .send(buf)
  })
}

describe('e2e js error handling', () => {
  systemTests.setup({
    servers: [{
      port: 1122,
      static: true,
    }, {
      port: 1123,
      onServer,
    }],
  })

  systemTests.it('fails', {
    spec: 'js_error_handling_failing.cy.js',
    snapshot: true,
    expectedExitCode: 5,
    onStdout (stdout) {
      // firefox has a stack line for the cross-origin error that other browsers don't
      return stdout
      .replace(/cross-origin-script-error\s+?\(Results/, 'cross-origin-script-error\n\n  (Results')
      .replace(/cross-origin-script-error\s+at <unknown> \(http:\/\/localhost:1122\/static\/fail\.js:0:0\)\s+?\(Results/, 'cross-origin-script-error\n\n  (Results')
    },
  })
})
