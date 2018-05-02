Fixtures = require("../support/helpers/fixtures")
e2e      = require("../support/helpers/e2e")

e2ePath = Fixtures.projectPath("e2e")

onServer = (app) ->
  sendHtml = (contents) -> (req, res) ->
    res.set('Content-Type', 'text/html')
    res.send("""
      <!DOCTYPE html>
      <html lang="en">
      <body>
        #{contents}
      </body>
      </html>
    """)

  app.get "/app", sendHtml("""
    <div class="black-me-out" style="position: fixed; left: 10px; top: 10px;">Redacted</div>
  """)

  app.get "/fullpage", sendHtml("""
    <style>body { margin: 0; }</style>
    <div class="black-me-out" style="position: absolute; left: 10px; top: 10px;">Redacted</div>
    <div style="background: white; height: 200px;"></div>
    <div style="background: black; height: 200px;"></div>
    <div style="background: white; height: 100px;"></div>
  """)

  app.get "/element", sendHtml("""
    <style>body { margin: 0; }</style>
    <div class="black-me-out" style="position: absolute; left: 10px; top: 10px;">Redacted</div>
    <div class="capture-me" style="height: 300px; border: solid 1px black; margin: 20px;"></div>
  """)

describe "e2e screenshot app capture", ->
  e2e.setup({
    servers: {
      port: 3322
      onServer: onServer
    }
  })

  it "passes", ->
    ## this tests that consistent screenshots are taken for app
    ## and fullpage captures. that the runner UI is hidden and that
    ## the page is scrolled properly on fullpage captures

    e2e.exec(@, {
      spec: "screenshot_app_capture_spec.coffee"
      expectedExitCode: 0
      snapshot: true
      timeout: 300000 ## 5 minutes
    })
