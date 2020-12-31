import e2e from '../support/helpers/e2e'
import parser from 'cookie-parser'

const onServer = function (app) {
  app.use(parser())

  app.get('*', (req, res, next) => {
    res.cookie(req.path, 'value', {
      sameSite: 'None',
      secure: true,
    })

    next()
  })

  app.get('/link', (req, res) => {
    res.send('<html><h1>link</h1><a href=\'https://www.foo.com:44665/cross_origin\'>second</a></html>')
  })

  app.get('/cross_origin', (req, res) => {
    res.send('<html><h1>cross origin</h1></html>')
  })

  app.get('/cross_origin_iframe', (req, res) => {
    res.send('<html><body><h1>cross_origin_iframe</h1><iframe src="https://127.0.0.2:44665/set-localStorage"</body></html>')
  })

  app.get('/cross_origin_iframe2', (req, res) => {
    res.send('<html><body><h1>cross_origin_iframe2</h1><iframe src="https://127.0.0.3:44665/set-localStorage2"</body></html>')
  })

  app.get('/set-localStorage', (req, res) => {
    res.send('<html><body><h1>set-localStorage</h1><script>window.localStorage.clear(); window.localStorage.foo = "bar"</script></body></html>')
  })

  app.get('/set-localStorage2', (req, res) => {
    res.send('<html><body><h1>set-localStorage2</h2><script>window.localStorage.clear(); window.localStorage.foo = "bar"</script></body></html>')
  })

  app.get('/make-reqs', (req, res) => {
    res.send(`<body><script>(function() {
      fetch('/keep_open')
      req = new XMLHttpRequest()
      req.open('GET', '/keep_open')
      req.send()

    })()</script></body>`)
  })

  app.get('/redirect', (req, res) => {
    res.redirect(302)
  })

  app.get('/keep_open', (req, res) => {
    // dont respond
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

describe('e2e sessions', () => {
  e2e.setup({
    servers: [{
      port: 4466,
      https: true,
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

  e2e.it('useSession/defineSession + utils test', {
    spec: 'session_spec.js',
    snapshot: true,
    config: {
      experimentalSessionSupport: true,
      video: false,
    },
  })
})
