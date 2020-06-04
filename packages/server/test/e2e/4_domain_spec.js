// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require('../support/helpers/e2e').default

const hosts = {
  'app.localhost': '127.0.0.1',
  'foo.bar.baz.com.au': '127.0.0.1',
}

describe('e2e domain', () => {
  e2e.setup({
    servers: {
      port: 4848,
      static: true,
    },
  })

  return e2e.it('passes', {
    spec: 'domain*',
    snapshot: true,
    video: false,
    config: {
      hosts,
    },
  })
})
