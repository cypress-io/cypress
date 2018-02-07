cors     = require("cors")
parser   = require("cookie-parser")
session  = require("express-session")
e2e      = require("../support/helpers/e2e")

onServer = (app) ->
  app.use(parser())

  app.use (req, res, next) ->
    console.log "** REQUEST HEADERS ARE", req.url, req.headers
    next()

  getIndex = ->
    """
    <!DOCTYPE html>
    <html>
    <head>
    </head>
    <body>
      <ul>
        <li>
          <a href="http://help.foobar.com:2292">switch to http://help.foobar.com</a>
        </li>
      </ul>
    </body>
    </html>
    """

  getText = (text) ->
    """
    <!DOCTYPE html>
    <html>
    <head>
    </head>
    <body>
      <h1>#{text}</h1>
    </body>
    </html>
    """

  applySession = session({
    name: "secret-session"
    secret: "secret"
    cookie: {
      sameSite: true
    }
  })

  app.get "/htmlCookies", (req, res) ->
    cookie = req.headers.cookie

    res.send("<html><div id='cookie'>#{cookie}</div></html>")

  app.get "/cookies*", cors({origin: true, credentials: true}), (req, res) ->
    res.json({
      cookie: req.headers["cookie"]
      parsed: req.cookie
    })

  app.get "/redirect", (req, res) ->
    res.redirect("http://www.foobar.com:2292/cookies")

  app.get "/domainRedirect", (req, res) ->
    res.redirect("http://www.foobar.com:2292/htmlCookies")

  app.get "*", (req, res, next) ->
    res.set('Content-Type', 'text/html');

    getHtml = =>
      switch h = req.get("host")
        when "www.foobar.com:2292"
          getIndex()

        when "help.foobar.com:2292"
          getText("Help")

        when "session.foobar.com:2292"
          applySession(req, res, next)

          getText("Session")

        when "domain.foobar.com:2292"
          res.cookie("nomnom", "good", {
            domain: ".foobar.com"
          })

          getText("Domain")

        when "qa.sub.foobar.com:2292", "staging.sub.foobar.com:2292"
          getText("Nested Subdomains")

        else
          throw new Error("Host: '#{h}' not recognized")

    res.send(getHtml())

describe "e2e subdomain", ->
  e2e.setup({
    servers: {
      port: 2292
      onServer: onServer
    }
  })

  it "passes", ->
    e2e.exec(@, {
      spec: "subdomain_spec.coffee"
      snapshot: true
      expectedExitCode: 0
      config: "hosts={*.foobar.com=127.0.0.1}"
    })
