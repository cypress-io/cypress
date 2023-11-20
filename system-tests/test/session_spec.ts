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
    res.send(`<html><body><h1>cross_origin_iframe ${req.params.name}</h1><iframe src="https://127.0.0.1:44665/set-localStorage/${req.params.name}"</body></html>`)
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
    res.send(`\
  <!DOCTYPE html>
  <head>
    <title>Home</title>
    <script>
      window.onLoad = function() {
        let cookies = document.cookie
        if (!cookies || cookies !== 'token=1') {
          window.location.href = "/cypress/fixtures/loginPage.html"
        }
      }
    </script>
  </head>
  <body>
      <h1>Home Page</h1>
  </body>
</html>
`)
  })

  app.get('/login', (req, res) => {
    res.send(`\
    <!DOCTYPE html>
  <head>
    <title>Login Page</title>
    <script>
      window.onload = function(){
        if (window.localStorage.getItem('persist') === 'true') {
          // global session data
          document.cookie = "token=1; Secure=true; SameSite=None"
          window.localStorage.setItem('animal', 'tiger')
          window.sessionStorage.setItem('food', 'zebra')
        } else {
          // spec session data
          document.cookie = "token=2; Secure=true; SameSite=None"
          window.localStorage.setItem('animal', 'bear')
          window.sessionStorage.setItem('food', 'salmon')
        }
      }
      function login(){
        window.location.href = "https://localhost:4466/home"
      }
    </script>
  </head>
  <body>
      <h1>Not Signed in...</h1>

      <button onClick="login()">Login</button>
  </body>
</html>
`)
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
      fetch('https://127.0.0.1:44665/cross_origin')
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
      e2e: {},
    },
  })

  it('session tests', {
    project: 'session-and-origin-e2e-specs',
    browser: 'chrome', // TODO(webkit): fix+unskip (needs multidomain support)
    spec: 'session/session.cy.js',
    snapshot: true,
  })

  it('handles spec and global sessions persistence on spec reload, and switching specs', {
    project: 'session-and-origin-e2e-specs',
    spec: 'session/session_persist_1.cy.js,session/session_persist_2.cy.js',
    browser: '!webkit', // TODO(webkit): fix+unskip (needs multidomain support)
    snapshot: true,
    config: {
      env: { SYSTEM_TESTS: true },
    },
  })
})
