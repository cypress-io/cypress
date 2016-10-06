cors     = require("cors")
parser   = require("cookie-parser")
session  = require("express-session")
e2e      = require("../helpers/e2e")

onServer = (app) ->
  app.use(parser())

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

  app.get "/cookies*", cors({origin: true, credentials: true}), (req, res) ->
    res.json({
      cookie: req.headers["cookie"]
      parsed: req.cookie
    })

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
            name: "domain-cookie"
            domain: ".foobar.com"
          })

          getText("Domain")

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
    e2e.start(@, {
      spec: "subdomain_spec.coffee"
      hosts: "*.foobar.com=127.0.0.1"
      expectedExitCode: 0
    })