const path = require('path')
const bodyParser = require('body-parser')
const Fixtures = require('../lib/fixtures')
const systemTests = require('../lib/system-tests').default

const e2ePath = Fixtures.projectPath('e2e')

const onServer = function (app) {
  app.use(bodyParser.json())

  app.get('/', (req, res) => {
    return res.send('<html>outer content<iframe src=\'/iframe\'></iframe></html>')
  })

  app.get('/500', (req, res) => {
    return res.send('<html>outer content<iframe src=\'/iframe_500\'></iframe></html>')
  })

  app.get('/sync_iframe', (req, res) => {
    return res.send(`\
<html>
outer contents
<iframe src='/timeout'></iframe>
</html>\
`)
  })

  app.get('/insert_iframe', (req, res) => {
    return res.send(`\
<html>
<script type='text/javascript'>
  window.insert = function(){
    var i = document.createElement("iframe")
    i.src = "/timeout"
    document.body.appendChild(i)
  }
</script>
<button onclick='insert()'>insert iframe</button>
</html>\
`)
  })

  app.get('/origin', (req, res) => {
    return res.send('<html>outer content<iframe src=\'http://www.bar.com/simple\'></iframe></html>')
  })

  app.get('/cross', (req, res) => {
    return res.send('<html>outer content<iframe src=\'http://www.bar.com:1616/simple\'></iframe></html>')
  })

  app.get('/simple', (req, res) => {
    return res.send('<html>simple</html>')
  })

  app.get('/iframe', (req, res) => {
    return res.sendFile(path.join(e2ePath, 'static', 'iframe', 'index.html'))
  })

  app.get('/iframe_500', (req, res) => {
    return res.status(500).sendFile(path.join(e2ePath, 'static', 'iframe', 'index.html'))
  })

  return app.get('/timeout', (req, res) => {
    return setTimeout(() => {
      return res.send('<html>timeout</html>')
    }
    , 2000)
  })
}

describe('e2e iframes', () => {
  systemTests.setup({
    servers: {
      port: 1616,
      onServer,
    },
  })

  systemTests.it('passes', {
    spec: 'iframe.cy.js',
    snapshot: true,
    config: {
      hosts: {
        '*.foo.com': '127.0.0.1',
        '*.bar.com': '127.0.0.1',
      },
    },
  })
})
