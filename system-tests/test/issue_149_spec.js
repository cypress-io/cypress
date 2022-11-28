const { fs } = require('@packages/server/lib/util/fs')
const Fixtures = require('../lib/fixtures')
const systemTests = require('../lib/system-tests').default

describe('e2e issue 149', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/149
  it('failing', function () {
    return systemTests.exec(this, {
      spec: 'issue_149.cy.js',
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
