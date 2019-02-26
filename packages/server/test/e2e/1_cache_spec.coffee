fs         = require("fs")
path       = require("path")
express    = require("express")
Fixtures   = require("../support/helpers/fixtures")
e2e        = require("../support/helpers/e2e")

replacerRe = /(<h1>)\w+(<\/h1>)/

e2ePath = Fixtures.projectPath("e2e")

requestsForCache = 0

onServer = (app) ->
  app.post "/write/:text", (req, res) ->
    file = path.join(e2ePath, "index.html")

    fs.readFile file, "utf8", (err, str) ->
      ## replace the word between <h1>...</h1>
      str = str.replace(replacerRe, "$1#{req.params.text}$2")

      fs.writeFile file, str, (err) ->
        res.sendStatus(200)

  app.get "/cached", (req, res) ->
    requestsForCache += 1

    res
    .set("cache-control", "public, max-age=3600")
    .send("this response will be disk cached")

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

  it "clears cache when browser is spawned", ->
    e2e.exec(@, {
      spec: "cache_clearing_spec.coffee"
      expectedExitCode: 0
    })
    .then =>
      ## only 1 request should have gone out
      expect(requestsForCache).to.eq(1)

      e2e.exec(@, {
        spec: "cache_clearing_spec.coffee"
        expectedExitCode: 0
      })
      .then ->
        ## and after the cache is cleaned before
        ## opening the browser, it'll make a new request
        expect(requestsForCache).to.eq(2)
