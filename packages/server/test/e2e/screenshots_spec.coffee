_        = require("lodash")
fs       = require("fs-extra")
path     = require("path")
Promise  = require("bluebird")
sizeOf   = require("image-size")
Fixtures = require("../support/helpers/fixtures")
e2e      = require("../support/helpers/e2e")

fs      = Promise.promisifyAll(fs)
sizeOf  = Promise.promisify(sizeOf)
e2ePath = Fixtures.projectPath("e2e")

onServer = (app) ->
  getHtml = (color) ->
    """
    <!DOCTYPE html>
    <html lang="en">
    <body>
      <div style="height: 2000px; width: 2000px; background-color: #{color};"></div>
    </body>
    </html>
    """

  app.get "/color/:color", (req, res) ->
    res.set('Content-Type', 'text/html');

    res.send(getHtml(req.params.color))

describe "e2e screenshots", ->
  e2e.setup({
    servers: {
      port: 3322
      onServer: onServer
    }
  })

  it "passes", ->
    ## this tests that screenshots can be manually generated
    ## and are also generated automatically on failure with
    ## the test title as the file name

    e2e.exec(@, {
      spec: "screenshots_spec.coffee"
      expectedExitCode: 4
      snapshot: true
    })
    .then ->
      screenshot1 = path.join(e2ePath, "cypress", "screenshots", "black.png")
      screenshot2 = path.join(e2ePath, "cypress", "screenshots", "red.png")
      screenshot3 = path.join(e2ePath, "cypress", "screenshots", "foobarbaz.png")
      screenshot4 = path.join(e2ePath, "cypress", "screenshots", "taking screenshots -- generates pngs on failure.png")
      screenshot5 = path.join(e2ePath, "cypress", "screenshots", "taking screenshots -- before hooks -- empty test 1 -- before all hook.png")
      screenshot6 = path.join(e2ePath, "cypress", "screenshots", "taking screenshots -- each hooks -- empty test 2 -- before each hook.png")
      screenshot7 = path.join(e2ePath, "cypress", "screenshots", "taking screenshots -- each hooks -- empty test 2 -- after each hook.png")

      Promise.all([
        fs.statAsync(screenshot1).get("size")
        fs.statAsync(screenshot2).get("size")
        fs.statAsync(screenshot3).get("size")
        fs.statAsync(screenshot4).get("size")
        fs.statAsync(screenshot5).get("size")
        fs.statAsync(screenshot6).get("size")
        fs.statAsync(screenshot7).get("size")
      ])
      .then (sizes) ->
        ## make sure all of the values are unique
        expect(sizes).to.deep.eq(_.uniq(sizes))

        ## png1 should not be within 5k of png2
        expect(sizes[0]).not.to.be.closeTo(sizes[1], 5000)

        ## png3 should not be within 1.5k of png4
        expect(sizes[2]).not.to.be.closeTo(sizes[3], 1500)
      .then ->
        Promise.all([
          sizeOf(screenshot1)
          sizeOf(screenshot2)
          sizeOf(screenshot3)
          sizeOf(screenshot4)
          sizeOf(screenshot5)
          sizeOf(screenshot6)
          sizeOf(screenshot7)
        ])
      .then (dimensions = []) ->
        ## all of the images should be 1280x720
        ## since thats what we run headlessly
        _.each dimensions, (dimension) ->
          expect(dimension).to.deep.eq({width: 1280, height: 720, type: "png"})
