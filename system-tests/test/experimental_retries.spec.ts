import systemTests from '../lib/system-tests'

describe('e2e retries.experimentalStrategy', () => {
  systemTests.setup()

  describe('experimentalBurnIn=false', () => {
    describe('"detect-flake-and-pass-on-threshold"', () => {
      describe('passes', () => {
        systemTests.it('only runs the first attempt of the test if the test passes', {
          project: 'experimental-retries',
          browser: '!webkit',
          spec: 'always-passes.cy.js',
          snapshot: true,
          expectedExitCode: 0,
          config: {
            experimentalBurnIn: false,
            retries: {
              openMode: false,
              runMode: true,
              experimentalStrategy: 'detect-flake-and-pass-on-threshold',
              experimentalOptions: {
                maxRetries: 10,
                passesRequired: 3,
              },
            },
            screenshotOnRunFailure: false,
          },
        })

        systemTests.it('retries up to the "passesRequired" limit if the config can be satisfied', {
          project: 'experimental-retries',
          browser: '!webkit',
          spec: 'deterministic-flaky.cy.js',
          snapshot: true,
          expectedExitCode: 0,
          config: {
            experimentalBurnIn: false,
            retries: {
              openMode: false,
              runMode: true,
              experimentalStrategy: 'detect-flake-and-pass-on-threshold',
              experimentalOptions: {
                maxRetries: 9,
                passesRequired: 3,
              },
            },
            screenshotOnRunFailure: false,
          },
        })

        systemTests.it('retries up to the "passesRequired" limit if the config can be satisfied (max attempts)', {
          project: 'experimental-retries',
          browser: '!webkit',
          spec: 'deterministic-flaky.cy.js',
          snapshot: true,
          expectedExitCode: 0,
          config: {
            experimentalBurnIn: false,
            retries: {
              openMode: false,
              runMode: true,
              experimentalStrategy: 'detect-flake-and-pass-on-threshold',
              experimentalOptions: {
                maxRetries: 9,
                passesRequired: 5,
              },
            },
            screenshotOnRunFailure: false,
          },
        })
      })

      describe('fails', () => {
        systemTests.it('short-circuits if the needed "passesRequired" cannot be satisfied by the remaining attempts available', {
          project: 'experimental-retries',
          browser: '!webkit',
          spec: 'deterministic-flaky.cy.js',
          snapshot: true,
          expectedExitCode: 1,
          config: {
            experimentalBurnIn: false,
            retries: {
              openMode: false,
              runMode: true,
              experimentalStrategy: 'detect-flake-and-pass-on-threshold',
              experimentalOptions: {
                maxRetries: 5,
                passesRequired: 5,
              },
            },
            screenshotOnRunFailure: false,
          },
        })

        systemTests.it('retries up to the "passesRequired" limit if the config can be satisfied (max attempts possible)', {
          project: 'experimental-retries',
          browser: '!webkit',
          spec: 'deterministic-flaky.cy.js',
          snapshot: true,
          expectedExitCode: 1,
          config: {
            experimentalBurnIn: false,
            retries: {
              openMode: false,
              runMode: true,
              experimentalStrategy: 'detect-flake-and-pass-on-threshold',
              experimentalOptions: {
                maxRetries: 6,
                passesRequired: 4,
              },
            },
            screenshotOnRunFailure: false,
          },
        })
      })

      /**
       * exercised additionally in cy-in-cy tests to verify correct mocha snapshots and cypress reporter output:
       *     packages/app/cypress/e2e/runner/retries.experimentalRetries.mochaEvents.cy.ts
       *     packages/app/cypress/e2e/runner/runner.experimentalRetries.mochaEvents.cy.ts
       */
      systemTests.it('exercises experimental-retries suite to verify console reporter and final status code are correct.', {
        project: 'detect-flake-and-pass-on-threshold',
        browser: '!webkit',
        spec: 'runner/experimental-retries/*',
        snapshot: true,
        expectedExitCode: 2,
        config: {
          experimentalBurnIn: false,
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 9,
              passesRequired: 5,
            },
          },
          screenshotOnRunFailure: false,
        },
      })
    })

    describe('"detect-flake-but-always-fail"', () => {
      describe('passes', () => {
        systemTests.it('only runs the first attempt of the test if the test passes', {
          project: 'experimental-retries',
          browser: '!webkit',
          spec: 'always-passes.cy.js',
          snapshot: true,
          expectedExitCode: 0,
          config: {
            experimentalBurnIn: false,
            retries: {
              openMode: false,
              runMode: true,
              experimentalStrategy: 'detect-flake-but-always-fail',
              experimentalOptions: {
                maxRetries: 9,
                stopIfAnyPassed: false,
              },
            },
            screenshotOnRunFailure: false,
          },
        })
      })

      describe('fails', () => {
        systemTests.it('runs all attempts of the test if the first attempt fails and "stopIfAnyPassed=false"', {
          project: 'experimental-retries',
          browser: '!webkit',
          spec: 'deterministic-flaky.cy.js',
          snapshot: true,
          expectedExitCode: 1,
          config: {
            experimentalBurnIn: false,
            retries: {
              openMode: false,
              runMode: true,
              experimentalStrategy: 'detect-flake-but-always-fail',
              experimentalOptions: {
                maxRetries: 9,
                stopIfAnyPassed: false,
              },
            },
            screenshotOnRunFailure: false,
          },
        })

        systemTests.it('runs attempts of the test if the first attempt fails until the test passes if "stopIfAnyPassed=true"', {
          project: 'experimental-retries',
          browser: '!webkit',
          spec: 'deterministic-flaky.cy.js',
          snapshot: true,
          expectedExitCode: 1,
          config: {
            experimentalBurnIn: false,
            retries: {
              openMode: false,
              runMode: true,
              experimentalStrategy: 'detect-flake-but-always-fail',
              experimentalOptions: {
                maxRetries: 9,
                stopIfAnyPassed: true,
              },
            },
            screenshotOnRunFailure: false,
          },
        })
      })

      /**
       * exercised additionally in cy-in-cy tests to verify correct mocha snapshots and cypress reporter output:
       *     packages/app/cypress/e2e/runner/retries.experimentalRetries.mochaEvents.cy.ts
       *     packages/app/cypress/e2e/runner/runner.experimentalRetries.mochaEvents.cy.ts
       */
      systemTests.it('exercises experimental-retries suite to verify console reporter and final status code are correct.', {
        project: 'detect-flake-but-always-fail',
        browser: '!webkit',
        spec: 'runner/experimental-retries/*',
        snapshot: true,
        // FIXME: this should be 8
        expectedExitCode: 9,
        config: {
          experimentalBurnIn: false,
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 9,
              stopIfAnyPassed: false,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      systemTests.it('exercises experimental-retries suite to verify console reporter and final status code are correct (stopIfAnyPassed=true).', {
        project: 'detect-flake-but-always-fail-stop-any-passed',
        browser: '!webkit',
        spec: 'runner/experimental-retries/*',
        snapshot: true,
        // FIXME: this should be 8
        expectedExitCode: 9,
        config: {
          experimentalBurnIn: false,
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 9,
              stopIfAnyPassed: true,
            },
          },
          screenshotOnRunFailure: false,
        },
      })
    })
  })
})
