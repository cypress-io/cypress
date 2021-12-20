import 'zone.js/dist/zone'

// @ts-ignore
global.Mocha['__zone_patch__'] = false
import 'zone.js/dist/zone-testing'
import 'zone.js/dist/async-test'
import 'zone.js/dist/fake-async-test'
import 'zone.js/dist/long-stack-trace-zone'
import 'zone.js/dist/mocha-patch'
import { setupHooks } from '@cypress/mount-utils'

setupHooks()

beforeEach(() => {
  const html = `
    <!DOCTYPE html>
    <head>
      <meta charset="UTF-8">
      <base href="/">
    </head>
    <body>
      <root0 id="root"></root0>
    </body>
  `
  // @ts-ignore
  const document = cy.state('document')

  document.write(html)
  document.close()
})
