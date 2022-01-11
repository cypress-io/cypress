const systemTests = require('../lib/system-tests').default

const onServer = (app) => {
  return app.get('/viewport', systemTests.sendHtml(`\
<div class="black-me-out" style="position: fixed; left: 10px; top: 10px; width: 10px; height: 10px;"></div>
<div class="black-me-out" style="position: absolute; left: 30px; top: 10px; width: 10px; height: 10px;"></div>\
`))
}

describe('e2e screenshot viewport capture', () => {
  systemTests.setup({
    servers: {
      port: 3322,
      onServer,
    },
  })

  // this tests that consistent screenshots are taken for app
  // captures (namely that the runner UI is hidden)
  systemTests.it('passes', {
    spec: 'screenshot_viewport_capture.cy.js',
    snapshot: true,
  })
})
