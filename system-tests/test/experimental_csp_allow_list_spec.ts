import path from 'path'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

const PORT = 3500
const onServer = function (app) {
  app.get(`/csp_empty_style.css`, (req, res) => {
    // instead of logging, check the color of the h1 inside csp_script_test.html to see if the h1 text color is purple to verify the script ran
    res.sendFile(path.join(e2ePath, `static/csp_styles.css`))
  })

  app.get(`/csp_empty_script.js`, (req, res) => {
    // log the host of the script to postMessage to verify if the script ran or not depending on the test
    const script = `window.top.postMessage({ event: 'csp-script-ran', data: 'script src origin ${req.get('host')} script ran'}, '*')`

    res.send(script)
  })

  app.get(`/csp_script_test.html`, (req, res) => {
    const { csp } = req.query

    res.setHeader('Content-Security-Policy', csp)
    res.sendFile(path.join(e2ePath, `csp_script_test.html`))
  })
}

// NOTE: 'navigate-to' is a CSP 3.0 feature and currently is not shipped with any major browser version. @see https://csplite.com/csp123/.
describe('e2e experimentalCspAllowList', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer,
    }],
    settings: {
      hosts: {
        '*.foobar.com': '127.0.0.1',
      },
      e2e: {},
    },
  })

  describe('experimentalCspAllowList=true', () => {
    systemTests.it('strips out [\'script-src-elem\', \'script-src\', \'default-src\', \'form-action\'] directives', {
      browser: '!webkit', // TODO(webkit): fix+unskip
      port: PORT,
      spec: 'experimental_csp_allow_list_spec/with_allow_list_true.cy.ts',
      snapshot: true,
      expectedExitCode: 0,
      config: {
        videoCompression: false,
        retries: 0,
        experimentalCspAllowList: true,
      },
    })

    systemTests.it('always strips known problematic directives and is passive with known working directives', {
      browser: '!webkit', // TODO(webkit): fix+unskip
      port: PORT,
      spec: 'experimental_csp_allow_list_spec/with_allow_list_custom_or_true.cy.ts',
      snapshot: true,
      expectedExitCode: 0,
      config: {
        videoCompression: false,
        retries: 0,
        experimentalCspAllowList: true,
      },
    })
  })

  // NOTE: these tests do not 100% work in webkit and are problematic in CI with firefox.
  describe('experimentalCspAllowList=[\'script-src-elem\', \'script-src\', \'default-src\', \'form-action\']', () => {
    systemTests.it('works with [\'script-src-elem\', \'script-src\', \'default-src\'] directives', {
      browser: ['chrome', 'electron'],
      port: PORT,
      spec: 'experimental_csp_allow_list_spec/with_allow_list_custom.cy.ts',
      snapshot: true,
      expectedExitCode: 0,
      config: {
        videoCompression: false,
        retries: 0,
        experimentalCspAllowList: ['script-src-elem', 'script-src', 'default-src'],
      },
    })

    systemTests.it('always strips known problematic directives and is passive with known working directives', {
      browser: ['chrome', 'electron'],
      port: PORT,
      spec: 'experimental_csp_allow_list_spec/with_allow_list_custom_or_true.cy.ts',
      snapshot: true,
      expectedExitCode: 0,
      config: {
        videoCompression: false,
        retries: 0,
        experimentalCspAllowList: ['script-src-elem', 'script-src', 'default-src', 'form-action'],
      },
    })

    systemTests.it('works with [\'form-action\'] directives', {
      // NOTE: firefox respects on form action, but the submit handler does not trigger a error
      browser: ['chrome', 'electron'],
      port: PORT,
      spec: 'experimental_csp_allow_list_spec/form_action_with_allow_list_custom.cy.ts',
      snapshot: true,
      expectedExitCode: 1,
      config: {
        videoCompression: false,
        retries: 0,
        experimentalCspAllowList: ['form-action'],
      },
    })
  })
})
