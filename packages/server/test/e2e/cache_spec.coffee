fs         = require("fs")
path       = require("path")
express    = require("express")
Fixtures   = require("../support/helpers/fixtures")
e2e        = require("../support/helpers/e2e")

replacerRe = /(<h1>)\w+(<\/h1>)/

e2ePath = Fixtures.projectPath("e2e")

onServer = (app) ->
  app.post "/write/:text", (req, res) ->
    file = path.join(e2ePath, "index.html")

    fs.readFile file, "utf8", (err, str) ->
      ## replace the word between <h1>...</h1>
      str = str.replace(replacerRe, "$1#{req.params.text}$2")

      fs.writeFile file, str, (err) ->
        res.sendStatus(200)

describe "e2e cache", ->
  e2e.setup({
    servers: {
      port: 1515
      onServer: onServer
      static: {
        ## force caching to happen
        maxAge: 3600000
      }
    }
  })

  it "passes", ->
    e2e.exec(@, {
      spec: "cache_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
