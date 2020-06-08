const e2e = require('../support/helpers/e2e').default

const onServer = (app) => {
  return app.get('/element', e2e.sendHtml(`\
<style>body { margin: 0; }</style>
<div class="capture-me" style="height: 300px; border: solid 1px black; margin: 20px;">
<div style="background: black; height: 150px;"></div>
</div>\
`))
}

describe('e2e screenshot element capture', () => {
  e2e.setup({
    servers: {
      port: 3322,
      onServer,
    },
  })

  // this tests that consistent screenshots are taken for element captures,
  // that the runner UI is hidden and that the page is scrolled properly
  e2e.it('passes', {
    spec: 'screenshot_element_capture_spec.coffee',
    snapshot: true,
  })
})
