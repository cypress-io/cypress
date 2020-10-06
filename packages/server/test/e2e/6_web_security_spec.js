const e2e = require('../support/helpers/e2e').default

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
      fetch('https://127.0.0.2:44665/cross_origin')
      .then((res) => res.text())
      .then(text => {
        if (text.includes('cross origin')) document.write('success!')
      })
      .catch(err => document.write(err.message))
    </script>`)
  })
}

describe('e2e web security', () => {
  e2e.setup({
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
      },
    },
  })

  context('when enabled', () => {
    e2e.it('fails', {
      spec: 'web_security_spec.js',
      snapshot: true,
      expectedExitCode: 4,
    })
  })

  context('when disabled', () => {
    e2e.it('passes', {
      spec: 'web_security_spec.js',
      config: {
        chromeWebSecurity: false,
      },
      snapshot: true,
      browser: ['chrome', 'electron'],
    })
  })

  context('firefox', () => {
    e2e.it('displays warning when firefox and chromeWebSecurity:false', {
      spec: 'simple_passing_spec.coffee',
      snapshot: true,
      browser: 'firefox',
      config: {
        chromeWebSecurity: false,
      },
      onStdout (stdout) {
        expect(stdout).include('Your project has set the configuration option: `chromeWebSecurity: false`\n\nThis option will not have an effect in Firefox.')
      },
    })
  })
})
