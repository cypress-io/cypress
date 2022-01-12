const systemTests = require('../lib/system-tests').default

// TODO(lachlan): get these passing, issue is we need to hide the <TopNav />
// so it won't make a request to npm to get the latest Cypress version,
const tempSkip = Date.now() > new Date('2022-01-14') ? it : it.skip

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
  tempSkip('passes', {
    spec: 'screenshot_viewport_capture.cy.js',
    snapshot: true,
  })
})
