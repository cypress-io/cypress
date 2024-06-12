const systemTests = require('../lib/system-tests').default

describe('Browser Crash Handling', () => {
  systemTests.setup({
    settings: {
      e2e: {},
    },
  })

  // It should fail the chrome_tab_crash spec, but the simple spec should run and succeed
  ;['chrome', 'electron'].forEach((browser) => {
    context(`when the tab crashes in ${browser}`, () => {
      systemTests.it('fails', {
        browser,
        spec: 'chrome_tab_crash.cy.js,simple.cy.js',
        snapshot: true,
        expectedExitCode: 1,
      })
    })
  })

  // It should fail the chrome_tab_close spec, and exit early, do not move onto the next spec
  context('when the tab closes in chrome', () => {
    // const outputPath = path.join(e2ePath, 'output.json')

    systemTests.it('fails', {
      browser: 'chrome',
      spec: 'chrome_tab_close.cy.js,simple.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      // outputPath,
      async onStdout (stdout) {
        // TODO: we should be outputting valid json even
        // if we early exit
        //
        // const json = await fs.readJsonAsync(outputPath)
        // json.runs = systemTests.normalizeRuns(json.runs)

        // // also mutates into normalized obj ready for snapshot
        // expectCorrectModuleApiResult(json, {
        //   e2ePath, runs: 4, video: false,
        // })

        const running = stdout.split('Running:').length - 1

        expect(running).to.eq(1)

        expect(stdout).to.include('1 of 2')
        expect(stdout).not.to.include('2 of 2')
      },
    })
  })

  // It should fail the chrome_tab_close spec, and exit early, do not move onto the next spec
  context('when the tab closes in electron', () => {
    systemTests.it('fails', {
      browser: 'electron',
      spec: 'chrome_tab_close.cy.js,simple.cy.js',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // It should fail the chrome_process_kill spec, but the simple spec should run and succeed
  // NOTE: we do NOT test the "browser process" being killed OR crashed in electron because
  // there is no valid situation to simulate this. the main browser process is actually
  // not the renderer process but the actual electron process, and killing it would be
  // killing the entire cypress process, which is unrecoverable. this is also the same
  // thing as hitting "CMD+C" in the terminal to kill the cypress process, so its not
  // a situation we have to test for.
  context('when the browser process is killed in chrome', () => {
    systemTests.it('fails', {
      browser: 'chrome',
      spec: 'chrome_process_kill.cy.js,simple.cy.js',
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // It should fail the chrome_tab_crash spec, but the simple spec should run and succeed
  context('when the browser process crashes in chrome', () => {
    systemTests.it('fails w/ video off', {
      browser: 'chrome',
      spec: 'chrome_process_crash.cy.js,simple.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      config: {
        video: false,
      },
      onStdout: (stdout) => {
        // the location of this warning is non-deterministic
        return stdout.replace('The automation client disconnected. Cannot continue running tests.\n', '')
      },
    })

    systemTests.it('fails w/ video on', {
      browser: 'chrome',
      spec: 'chrome_process_crash.cy.js,simple.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      config: {
        video: true,
      },
      onStdout: (stdout) => {
        // the location of this warning is non-deterministic
        return stdout.replace('The automation client disconnected. Cannot continue running tests.\n', '')
      },
    })
  })

  context('when the window closes mid launch of the browser process', () => {
    systemTests.it('passes', {
      browser: 'electron',
      spec: 'abort_beforeunload_event_child.cy.ts,abort_beforeunload_event.cy.ts',
      snapshot: true,
      expectedExitCode: 0,
      config: {
        video: false,
      },
    })
  })
})
