const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

describe('e2e issue 8111 iframe input focus', function () {
  e2e.setup()

  e2e.it('iframe input retains focus when browser is out of focus', {
    project: Fixtures.projectPath('issue-8111-iframe-input'),
    spec: 'iframe_input_spec.js',
    browser: 'chrome',
  })
})
