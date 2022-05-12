const systemTests = require('../lib/system-tests').default

const onServer = function (app) {
  app.get('/color/:color', (req, res) => {
    return systemTests.sendHtml(`\
    <style>body { margin: 0; }</style>
    <div style="height: 2000px; width: 2000px; background-color: ${req.params.color};"></div>`)(req, res)
  })

  app.get('/fullPage', systemTests.sendHtml(`\
    <style>body { margin: 0; }</style>
    <div style="background: white; height: 200px;"></div>
    <div style="background: black; height: 200px;"></div>
    <div style="background: white; height: 100px;"></div>\
  `))

  app.get('/fullPage-same', systemTests.sendHtml(`\
    <style>body { margin: 0; }</style>
    <div style="height: 500px;"></div>\
  `))

  app.get('/element', systemTests.sendHtml(`\
    <div class="element" style="background: red; width: 400px; height: 300px; margin: 20px;"></div>\
  `))
}

describe('e2e cy.origin screenshots', function () {
  systemTests.setup({
    servers: {
      port: 3322,
      onServer,
    },
  })

  systemTests.it('correctly takes screenshots from the spec bridge', {
    spec: 'cy_origin_screenshots.cy.js',
    expectedExitCode: 0,
    timeout: 180000,
    config: {
      experimentalSessionAndOrigin: true,
      hosts: {
        '*.foobar.com': '127.0.0.1',
      },
    },
  })
})
