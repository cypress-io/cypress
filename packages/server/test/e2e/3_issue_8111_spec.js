const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

describe('e2e issue 8111 iframe input focus', function () {
  e2e.setup()

  e2e.it('iframe input retains focus when browser is out of focus', {
    // this test is dependent on the browser being Chrome headed
    // and also having --auto-open-devtools-for-tabs plugins option
    // (which pulls focus from main browser window)
    project: Fixtures.projectPath('issue-8111-iframe-input'),
    spec: 'iframe_input_spec.js',
    browser: 'chrome',
    headed: true,
  })
})
