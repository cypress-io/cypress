const { fs } = require('@packages/server/lib/util/fs')
const Fixtures = require('../lib/fixtures')
const e2e = require('../lib/e2e').default

describe('e2e issue 149', () => {
  e2e.setup()

  // https://github.com/cypress-io/cypress/issues/149
  it('failing', function () {
    return e2e.exec(this, {
      spec: 'issue_149_spec.js',
      snapshot: true,
      expectedExitCode: 1,
    })
    .then(() => {
      // the other test should have still run which should
      // have created this file
      return fs.readFileAsync(Fixtures.projectPath('e2e/foo.js'), 'utf8')
    }).then((str) => {
      expect(str).to.eq('bar')
    })
  })
})
