import systemTests from '../lib/system-tests'
import parser from 'cookie-parser'
import BodyParser from 'body-parser'

const it = systemTests.it

const onServer = function (app) {
  app.use(parser())

  app.get('*', (req, res, next) => {
    res.cookie(req.path, 'value', {
      sameSite: 'None',
      secure: true,
    })

    next()
  })

  app.use(BodyParser.urlencoded())

  app.get('/link', (req, res) => {
    res.send('<html><h1>link</h1><a href=\'https://www.foo.com:44665/cross_origin\'>second</a></html>')
  })

  app.get('/status/:code', (req, res) => {
    res.sendStatus(+req.params.code)
  })

  app.get('/cross_origin', (req, res) => {
    res.send('<html><h1>cross origin</h1></html>')
  })

  app.get('/cross_origin_iframe/:name', (req, res) => {
    res.send(`<html><body><h1>cross_origin_iframe ${req.params.name}</h1><iframe src="https://127.0.0.2:44665/set-localStorage/${req.params.name}"</body></html>`)
  })

  app.get('/set-localStorage/:name', (req, res) => {
    res.send(`<html><body><h1>set-localStorage ${req.params.name}</h1><script>window.localStorage.clear(); window.localStorage.name = "${req.params.name}"</script></body></html>`)
  })

  app.get('/make-reqs', (req, res) => {
    res.send(`<body><script>(function() {
      fetch('/keep_open')
      req = new XMLHttpRequest()
      req.open('GET', '/keep_open')
      req.send()

    })()</script></body>`)
  })

  app.get('/form', (req, res) => {
    res.send(`\
<html>
<h1>form</h1>
<form method='POST' action='/submit'>
  <input name='delay' />
</form>
</html>\
`)
  })

  app.post('/submit', (req, res) => {
    if (req.body.delay) {
      return setTimeout(() => {
        res.redirect('/home')
      }, +req.body.delay)
    }

    res.redirect('/home')
  })

  app.get('/home', (req, res) => {
    res.send('<html><h1>home</h1></html>')
  })

  app.get('/redirect', (req, res) => {
    res.redirect('/home')
  })

  app.get('/keep_open', (req, res) => {
    // dont respond
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
  systemTests.setup({
    servers: [{
      port: 4466,
      https: true,
      onServer,
    }, {
      port: 44665,
      https: true,
      onServer,
    }, {
      port: 4465,
      // https: true,
      onServer,
    }],
    settings: {
      hosts: {
        '*.foo.com': '127.0.0.1',
      },
    },
  })

  it('session tests', {
    spec: 'session.cy.js',
    snapshot: true,
    config: {
      experimentalSessionSupport: true,
      video: false,
    },
  })

  it('sessions persist on reload, and clear between specs', {
    spec: 'session_persist_spec_1.js,session_persist_spec_2.js',
    snapshot: true,
    config: {
      experimentalSessionSupport: true,
      video: false,
    },
  })
})
