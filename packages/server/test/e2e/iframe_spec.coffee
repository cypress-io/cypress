fs         = require("fs")
path       = require("path")
bodyParser = require("body-parser")
Fixtures   = require("../support/helpers/fixtures")
e2e        = require("../support/helpers/e2e")

e2ePath = Fixtures.projectPath("e2e")

onServer = (app) ->
  app.use(bodyParser.json())

  app.get "/", (req, res) ->
    res.send("<html>outer content<iframe src='/iframe'></iframe></html>")

  app.get "/500", (req, res) ->
    res.send("<html>outer content<iframe src='/iframe_500'></iframe></html>")

  app.get "/sync_iframe", (req, res) ->
    res.send("""
      <html>
        outer contents
        <iframe src='/timeout'></iframe>
      </html>
    """)

  app.get "/insert_iframe", (req, res) ->
    res.send("""
      <html>
        <script type='text/javascript'>
          window.insert = function(){
            var i = document.createElement("iframe")
            i.src = "/timeout"
            document.body.appendChild(i)
          }
        </script>
        <button onclick='insert()'>insert iframe</button>
      </html>
    """)

  app.get "/gzip_500", (req, res) ->
    buf = fs.readFileSync(Fixtures.path("server/gzip-bad.html.gz"))

    res.set({
      "content-type": "text/html"
      "content-encoding": "gzip"
    })
    .send(buf)

  app.get "/req", (req, res) ->
    res.send("<html>outer content<a href='/page/does-not-exist'>link</a><iframe src='http://err.foo.com:1616/gzip_500'></iframe></html>")

  app.get "/origin", (req, res) ->
    res.send("<html>outer content<iframe src='http://www.bar.com/simple'></iframe></html>")

  app.get "/cross", (req, res) ->
    res.send("<html>outer content<iframe src='http://www.bar.com:1616/simple'></iframe></html>")

  app.get "/simple", (req, res) ->
    res.send("<html>simple</html>")

  app.get "/iframe", (req, res) ->
    ## send the iframe contents
    res.sendFile(path.join(e2ePath, "static", "iframe", "index.html"))

  app.get "/iframe_500", (req, res) ->
    res.status(500).sendFile(path.join(e2ePath, "static", "iframe", "index.html"))

  app.get "/timeout", (req, res) ->
    setTimeout ->
      res.send("<html>timeout</html>")
    , 2000

describe "e2e iframes", ->
  e2e.setup({
    servers: {
      port: 1616
      onServer: onServer
    }
  })

  it "passes", ->
    e2e.exec(@, {
      spec: "iframe_spec.coffee"
      snapshot: true
      expectedExitCode: 0
      config: "hosts={*.foo.com=127.0.0.1|*.bar.com=127.0.0.1}"
    })
