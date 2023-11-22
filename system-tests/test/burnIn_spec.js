const systemTests = require('../lib/system-tests').default
const {
  createRoutes,
  setupStubbedServer,
  getRequestUrls,
  getRequests,
  postInstanceTestsResponse,
} = require('../lib/serverStub')

const assertRequestUrls = () => {
  expect(getRequestUrls()).deep.eq([
    'POST /runs',
    'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
    'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
    'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/results',
    'PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/artifacts',
    'PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/stdout',
    'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
  ])
}

const assertRunnerCapabilities = (requests) => {
  expect(requests[0].body).property('runnerCapabilities').deep.eq({
    'dynamicSpecsInSerialMode': true,
    'protocolMountVersion': 2,
    'skipSpecAction': true,
    'burnInTestAction': true,
  })
}

const assertPassedBurnIn = (postInstanceTestAttempts) => {
  expect(postInstanceTestAttempts.length).to.eq(2)
  expect(postInstanceTestAttempts[0].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
  expect(postInstanceTestAttempts[1].reasonToStop).to.eq('PASSED_BURN_IN')
  expect(postInstanceTestAttempts[1].initialStrategy).to.eq('BURN_IN')
}

const assertPassedMetThreshold = (postInstanceTestAttempts) => {
  expect(postInstanceTestAttempts.length).to.eq(5)
  expect(postInstanceTestAttempts[0].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
  expect(postInstanceTestAttempts[1].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[1].initialStrategy).to.eq('BURN_IN')
  expect(postInstanceTestAttempts[2].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[2].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[3].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[3].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[4].reasonToStop).to.eq('PASSED_MET_THRESHOLD')
  expect(postInstanceTestAttempts[4].initialStrategy).to.eq('RETRY')
}

const assertFailedReachedMaxRetries = (postInstanceTestAttempts) => {
  expect(postInstanceTestAttempts.length).to.eq(7)
  expect(postInstanceTestAttempts[0].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
  expect(postInstanceTestAttempts[1].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[1].initialStrategy).to.eq('BURN_IN')
  expect(postInstanceTestAttempts[2].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[2].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[3].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[3].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[4].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[4].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[5].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[5].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[6].reasonToStop).to.eq('FAILED_REACHED_MAX_RETRIES')
  expect(postInstanceTestAttempts[6].initialStrategy).to.eq('RETRY')
}

const assertFailedDidNotMeetThreshold = (postInstanceTestAttempts) => {
  expect(postInstanceTestAttempts.length).to.eq(6)
  expect(postInstanceTestAttempts[0].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
  expect(postInstanceTestAttempts[1].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[1].initialStrategy).to.eq('BURN_IN')
  expect(postInstanceTestAttempts[2].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[2].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[3].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[3].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[4].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[4].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[5].reasonToStop).to.eq('FAILED_DID_NOT_MEET_THRESHOLD')
  expect(postInstanceTestAttempts[5].initialStrategy).to.eq('RETRY')
}

const assertStoppedOnFlake = (postInstanceTestAttempts) => {
  expect(postInstanceTestAttempts.length).to.eq(2)
  expect(postInstanceTestAttempts[0].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
  expect(postInstanceTestAttempts[1].reasonToStop).to.eq('FAILED_STOPPED_ON_FLAKE')
  expect(postInstanceTestAttempts[1].initialStrategy).to.eq('BURN_IN')
}

const assertPassedFirstAttempt = (postInstanceTestAttempts) => {
  expect(postInstanceTestAttempts.length).to.eq(1)
  expect(postInstanceTestAttempts[0].reasonToStop).to.eq('PASSED_FIRST_ATTEMPT')
  expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
}

const assetPassedMetThresholdWithoutBurnIn = (postInstanceTestAttempts) => {
  expect(postInstanceTestAttempts.length).to.eq(4)
  expect(postInstanceTestAttempts[0].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
  expect(postInstanceTestAttempts[1].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[1].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[2].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[2].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[3].reasonToStop).to.eq('PASSED_MET_THRESHOLD')
  expect(postInstanceTestAttempts[3].initialStrategy).to.eq('RETRY')
}

const assertFailedReachedMaxRetriesWithoutBurnIn = (postInstanceTestAttempts) => {
  expect(postInstanceTestAttempts.length).to.eq(6)
  expect(postInstanceTestAttempts[0].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
  expect(postInstanceTestAttempts[1].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[1].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[2].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[2].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[3].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[3].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[4].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[4].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[5].reasonToStop).to.eq('FAILED_REACHED_MAX_RETRIES')
  expect(postInstanceTestAttempts[5].initialStrategy).to.eq('RETRY')
}

const assertFailedDidNotMeetThresholdWithoutBurnIn = (postInstanceTestAttempts) => {
  expect(postInstanceTestAttempts.length).to.eq(5)
  expect(postInstanceTestAttempts[0].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
  expect(postInstanceTestAttempts[1].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[1].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[2].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[2].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[3].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[3].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[4].reasonToStop).to.eq('FAILED_DID_NOT_MEET_THRESHOLD')
  expect(postInstanceTestAttempts[4].initialStrategy).to.eq('RETRY')
}

const assertFailedStoppedOnFlake = (postInstanceTestAttempts) => {
  expect(postInstanceTestAttempts.length).to.eq(2)
  expect(postInstanceTestAttempts[0].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
  expect(postInstanceTestAttempts[1].reasonToStop).to.eq('FAILED_STOPPED_ON_FLAKE')
  expect(postInstanceTestAttempts[1].initialStrategy).to.eq('RETRY')
}

context('api burnin actions', () => {
  context('modified/new test', () => {
    setupStubbedServer(createRoutes({
      postInstanceTests: {
        res: (req, res) => {
          return res.json({
            ...postInstanceTestsResponse,
            actions: [{
              type: 'TEST',
              clientId: 'r3',
              payload: {
                config: {
                  values: {
                    default: 3,
                    flaky: 5,
                  },
                },
                startingScore: null,
                planType: 'enterprise',
              },
              action: 'BURN_IN',
            }],
          })
        },
      },

    }))

    it('PASSED_BURN_IN', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id-without-video.config.js',
        spec: 'b_record.cy.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertPassedBurnIn(postInstanceTestAttempts)
    })

    it('PASSED_MET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 6,
              passesRequired: 3,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertPassedMetThreshold(postInstanceTestAttempts)
    })

    it('FAILED_REACHED_MAX_RETRIES', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 6,
              stopIfAnyPassed: false,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedReachedMaxRetries(postInstanceTestAttempts)
    })

    it('FAILED_DID_NOT_MEET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 5,
              passesRequired: 4,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedDidNotMeetThreshold(postInstanceTestAttempts)
    })

    it('FAILED_STOPPED_ON_FLAKE', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 6,
              stopIfAnyPassed: true,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertStoppedOnFlake(postInstanceTestAttempts)
    })
  })

  context('failing without flake', () => {
    setupStubbedServer(createRoutes({
      postInstanceTests: {
        res: (req, res) => {
          return res.json({
            ...postInstanceTestsResponse,
            actions: [{
              type: 'TEST',
              clientId: 'r3',
              payload: {
                config: {
                  values: {
                    default: 3,
                    flaky: 5,
                  },
                },
                startingScore: 0,
                planType: 'enterprise',
              },
              action: 'BURN_IN',
            }],
          })
        },
      },
    }))

    it('PASSED_BURN_IN', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id-without-video.config.js',
        spec: 'b_record.cy.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertPassedBurnIn(postInstanceTestAttempts)
    })

    it('PASSED_MET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 6,
              passesRequired: 3,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertPassedMetThreshold(postInstanceTestAttempts)
    })

    it('FAILED_REACHED_MAX_RETRIES', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 6,
              stopIfAnyPassed: false,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedReachedMaxRetries(postInstanceTestAttempts)
    })

    it('FAILED_DID_NOT_MEET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 5,
              passesRequired: 4,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedDidNotMeetThreshold(postInstanceTestAttempts)
    })

    it('FAILED_STOPPED_ON_FLAKE', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 6,
              stopIfAnyPassed: true,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertStoppedOnFlake(postInstanceTestAttempts)
    })
  })

  context('flaky test', () => {
    setupStubbedServer(createRoutes({
      postInstanceTests: {
        res: (req, res) => {
          return res.json({
            ...postInstanceTestsResponse,
            actions: [{
              type: 'TEST',
              clientId: 'r3',
              payload: {
                config: {
                  values: {
                    default: 3,
                    flaky: 5,
                  },
                },
                startingScore: -1,
                planType: 'enterprise',
              },
              action: 'BURN_IN',
            }],
          })
        },
      },
    }))

    it('PASSED_BURN_IN', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id-without-video.config.js',
        spec: 'b_record.cy.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      expect(postInstanceTestAttempts.length).to.eq(4)
      expect(postInstanceTestAttempts[0].reasonToStop).to.eq(null)
      expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
      expect(postInstanceTestAttempts[1].reasonToStop).to.eq(null)
      expect(postInstanceTestAttempts[1].initialStrategy).to.eq('BURN_IN')
      expect(postInstanceTestAttempts[2].reasonToStop).to.eq(null)
      expect(postInstanceTestAttempts[2].initialStrategy).to.eq('BURN_IN')
      expect(postInstanceTestAttempts[3].reasonToStop).to.eq('PASSED_BURN_IN')
      expect(postInstanceTestAttempts[3].initialStrategy).to.eq('BURN_IN')
    })

    it('PASSED_MET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 6,
              passesRequired: 3,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertPassedMetThreshold(postInstanceTestAttempts)
    })

    it('FAILED_REACHED_MAX_RETRIES', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 6,
              stopIfAnyPassed: false,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedReachedMaxRetries(postInstanceTestAttempts)
    })

    it('FAILED_DID_NOT_MEET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 5,
              passesRequired: 4,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedDidNotMeetThreshold(postInstanceTestAttempts)
    })

    it('FAILED_STOPPED_ON_FLAKE', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 6,
              stopIfAnyPassed: true,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertStoppedOnFlake(postInstanceTestAttempts)
    })
  })

  context('cloud could not determine score', () => {
    setupStubbedServer(createRoutes({
      postInstanceTests: {
        res: (req, res) => {
          return res.json({
            ...postInstanceTestsResponse,
            actions: [{
              type: 'TEST',
              clientId: 'r3',
              payload: {
                config: {
                  values: {
                    default: 3,
                    flaky: 5,
                  },
                },
                startingScore: -2,
                planType: 'enterprise',
              },
              action: 'BURN_IN',
            }],
          })
        },
      },
    }))

    it('PASSED_FIRST_ATTEMPT', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id-without-video.config.js',
        spec: 'b_record.cy.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertPassedFirstAttempt(postInstanceTestAttempts)
    })

    it('PASSED_MET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 5,
              passesRequired: 2,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assetPassedMetThresholdWithoutBurnIn(postInstanceTestAttempts)
    })

    it('FAILED_REACHED_MAX_RETRIES', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 5,
              stopIfAnyPassed: false,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedReachedMaxRetriesWithoutBurnIn(postInstanceTestAttempts)
    })

    it('FAILED_DID_NOT_MEET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 5,
              passesRequired: 4,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedDidNotMeetThresholdWithoutBurnIn(postInstanceTestAttempts)
    })

    it('FAILED_STOPPED_ON_FLAKE', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 6,
              stopIfAnyPassed: true,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedStoppedOnFlake(postInstanceTestAttempts)
    })
  })

  context('test is already burned-in', () => {
    setupStubbedServer(createRoutes({
      postInstanceTests: {
        res: (req, res) => {
          return res.json({
            ...postInstanceTestsResponse,
            actions: [{
              type: 'TEST',
              clientId: 'r3',
              payload: {
                config: {
                  values: {
                    default: 3,
                    flaky: 5,
                  },
                },
                startingScore: 1,
                planType: 'enterprise',
              },
              action: 'BURN_IN',
            }],
          })
        },
      },
    }))

    it('PASSED_FIRST_ATTEMPT', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id-without-video.config.js',
        spec: 'b_record.cy.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      // since the test passed in the first attempt and the test was already burned-in, we don't try to burn-in again
      assertPassedFirstAttempt(postInstanceTestAttempts)
    })

    it('PASSED_MET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 5,
              passesRequired: 2,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assetPassedMetThresholdWithoutBurnIn(postInstanceTestAttempts)
    })

    it('FAILED_REACHED_MAX_RETRIES', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 5,
              stopIfAnyPassed: false,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedReachedMaxRetriesWithoutBurnIn(postInstanceTestAttempts)
    })

    it('FAILED_DID_NOT_MEET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-and-pass-on-threshold',
            experimentalOptions: {
              maxRetries: 5,
              passesRequired: 4,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedDidNotMeetThresholdWithoutBurnIn(postInstanceTestAttempts)
    })

    it('FAILED_STOPPED_ON_FLAKE', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'cypress.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          experimentalBurnIn: {
            default: 2,
            flaky: 4,
          },
          retries: {
            openMode: false,
            runMode: true,
            experimentalStrategy: 'detect-flake-but-always-fail',
            experimentalOptions: {
              maxRetries: 6,
              stopIfAnyPassed: true,
            },
          },
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertFailedStoppedOnFlake(postInstanceTestAttempts)
    })
  })
})
