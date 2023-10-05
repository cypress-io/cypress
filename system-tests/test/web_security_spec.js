const systemTests = require('../lib/system-tests').default

const onServer = function (app) {
  app.get('/link', (req, res) => {
    res.send('<html><h1>link</h1><a href=\'https://www.foo.com:44665/cross_origin\'>second</a></html>')
  })

  app.get('/cross_origin', (req, res) => {
    res.send('<html><h1>cross origin</h1></html>')
  })

  app.get('/form', (req, res) => {
    res.send(`\
<html>
<h1>form</h1>
<form method='POST' action='https://www.foo.com:44665/submit'>
  <input type='submit' name='foo' value='bar' />
</form>
</html>\
`)
  })

  app.post('/submit', (req, res) => {
    res.redirect('https://www.foo.com:44665/cross_origin')
  })

  app.get('/javascript', (req, res) => {
    res.send(`\
<html>
<script type='text/javascript'>
  window.redirect = function(){
    window.location.href = 'https://www.foo.com:44665/cross_origin'
  }
</script>
<h1>javascript</h1>
<button onclick='redirect()'>click me</button>
</html>\
`)
  })

  app.get('/cors', (req, res) => {
    res.send(`<script>
      fetch('https://www.foo.com:44665/cross_origin')
      .then((res) => res.text())
      .then(text => {
        if (text.includes('cross origin')) document.write('success!')
      })
      .catch(err => document.write(err.message))
    </script>`)
  })
}

describe('e2e web security', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer,
    }, {
      port: 44665,
      https: true,
      onServer,
    }],
    settings: {
      hosts: {
        '*.foo.com': '127.0.0.1',
        '*.bar.com': '127.0.0.1',
        '*.foobar.com': '127.0.0.1',
      },
      e2e: {},
    },
  })

  context('when enabled', () => {
    systemTests.it('fails', {
      browser: '!webkit', // TODO(webkit): fix+unskip
      spec: 'web_security.cy.js',
      config: {
        pageLoadTimeout: 5000,
      },
      snapshot: true,
      expectedExitCode: 4,
    })
  })

  context('when disabled', () => {
    systemTests.it('passes', {
      spec: 'web_security.cy.js',
      config: {
        chromeWebSecurity: false,
      },
      snapshot: true,
      browser: ['chrome', 'electron'],
    })
  })

  context('firefox', () => {
    systemTests.it('displays warning when firefox and chromeWebSecurity:false', {
      spec: 'simple_passing.cy.js',
      snapshot: true,
      // TODO(webkit): run this test in webkit
      browser: 'firefox',
      config: {
        chromeWebSecurity: false,
      },
      onStdout (stdout) {
        expect(stdout).include('Your project has set the configuration option: `chromeWebSecurity` to `false`.\n\nThis option will not have an effect in Firefox.')
      },
    })
  })
})
