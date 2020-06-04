// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require('../support/helpers/e2e').default

const onServer = function (app) {
  app.get('/first', (req, res) => {
    return res.send('<html><h1>first</h1><a href=\'/second\'>second</a></html>')
  })

  return app.get('/second', (req, res) => {
    return res.send('<html><h1>second</h1></html>')
  })
}

describe('e2e go', () => {
  e2e.setup({
    servers: {
      port: 1818,
      onServer,
    },
  })

  // this tests that history changes work as intended
  // there have been regressions in electron which would
  // otherwise cause these tests to fail
  return e2e.it('passes', {
    spec: 'go_spec.coffee',
    snapshot: true,
  })
})
