import systemTests from '../lib/system-tests'
import { createRoutes, getRequests, setupStubbedServer } from '../lib/serverStub'

const processEnv = {
  CYPRESS_BROWSER_ACTIVITY_TIMEOUT: 5000,
  CYPRESS_BROWSER_ACTIVITY_PROBE_TIMEOUT: 1000,
}

describe('Browser Hang Handling', () => {
  systemTests.setup()

  ;(['chrome', 'electron'] as const).forEach((browser) => {
    context(`when the renderer hangs in ${browser}`, () => {
      // It should fail the browser_hang spec, then relaunch the browser and run
      // the simple spec to completion
      systemTests.it('fails the hung spec and runs the next spec', {
        browser,
        spec: 'browser_hang.cy.ts,simple.cy.js',
        processEnv,
        expectedExitCode: 1,
        onStdout (stdout) {
          expect(stdout).to.include('browser stopped responding for over 5000ms')
          expect(stdout).to.include('The test that was running: a test suite with a browser hang > blocks the main thread')
          expect(stdout).to.include('Running:  simple.cy.js')
          expect(stdout).to.match(/✔\s+simple\.cy\.js/)
        },
      })
    })

    context(`when the run is quiet but the renderer is healthy in ${browser}`, () => {
      it('does not treat the run as hung', function () {
        return systemTests.exec(this, {
          project: 'e2e',
          browser,
          spec: 'browser_quiet_wait.cy.ts',
          processEnv: {
            ...processEnv,
            DEBUG: 'cypress:server:run',
          },
          expectedExitCode: 0,
        }).then(({ stdout, stderr }) => {
          expect(stdout).not.to.include('stopped responding')
          // confirms the liveness probe actually ran during the silent cy.wait
          expect(stderr).to.include('activity monitor: renderer still responsive, resuming')
        })
      })
    })
  })
})

describe('Browser Hang Handling when recording', () => {
  setupStubbedServer(createRoutes())

  it('sends a skip reason for tests after the hung test', async function () {
    await systemTests.exec(this, {
      key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
      configFile: 'cypress-with-project-id.config.js',
      browser: 'chrome',
      spec: 'browser_hang.cy.ts',
      record: true,
      processEnv,
      expectedExitCode: 1,
    })

    const results = getRequests().find((req) => /POST \/instances\/.*\/results/.test(req.url) && req.body.tests)

    expect(results, 'instance results request').to.exist

    const { tests, exception } = results.body

    expect(exception).to.include('browser stopped responding for over 5000ms')
    expect(tests.map((test) => test.state)).to.deep.eq(['passed', 'failed', 'skipped'])
    expect(tests[0].displayError).to.be.null
    expect(tests[1].displayError).to.include('The test that was running: a test suite with a browser hang > blocks the main thread')
    expect(tests[2].displayError).to.eq([
      'This test did not run because the spec ended early during "a test suite with a browser hang > blocks the main thread":',
      '',
      'We detected that the Chrome browser stopped responding for over 5000ms and did not recover.',
    ].join('\n'))
  })
})
