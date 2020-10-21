import e2e from '../support/helpers/e2e'

const onServer = function (app) {
  app.get('/link', (req, res) => {
    res.send('<html><h1>link</h1><a href=\'https://www.foo.com:44665/cross_origin\'>second</a></html>')
  })

  app.get('/cross_origin', (req, res) => {
    res.send('<html><h1>cross origin</h1></html>')
  })

  app.get('/cross_origin_iframe', (req, res) => {
    res.send('<html><body><iframe src="https://127.0.0.2:44665/set-localstorage"</body></html>')
  })

  app.get('/set-localstorage', (req, res) => {
    res.send('<html><body><script>window.localStorage.clear(); window.localStorage.foo = "bar"</script></body></html>')
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

describe('e2e cross domain automations', () => {
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

  e2e.it('backup localStorage', {
    spec: 'cross_origin_automation_spec.js',
    snapshot: true,
  })
})
