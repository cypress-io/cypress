const fs = require('fs')
const Fixtures = require('../support/helpers/fixtures')
const e2e = require('../support/helpers/e2e').default

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
      'content-type': 'application/javascript',
      'content-encoding': 'gzip',
    })
    .send(buf)
  })
}

describe('e2e js error handling', () => {
  e2e.setup({
    servers: [{
      port: 1122,
      static: true,
    }, {
      port: 1123,
      onServer,
    }],
  })

  e2e.it('fails', {
    spec: 'js_error_handling_failing_spec.js',
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
