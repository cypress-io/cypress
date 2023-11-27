const systemTests = require('../lib/system-tests').default
const {
  createRoutes,
  setupStubbedServer,
  getRequestUrls,
  getRequests,
  postInstanceTestsResponse,
} = require('../lib/serverStub')

const numberRegex = /"(wallClockDuration|fnDuration|afterFnDuration|lifecycle)":\"?(0|[1-9]\d*)(\.\d+)?\"?/g
const isoDateRegex = /"([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?"/g

const normalizeAttempts = (attemptsJson) => {
  const stringifiedAttempts = JSON.stringify(attemptsJson)
  const normalizedAttempts = stringifiedAttempts
  .replace(isoDateRegex, '"Any.ISODate"')
  .replace(numberRegex, '"$1": "Any.Number"')

  return JSON.parse(normalizedAttempts)
}

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

const assertAttempts = (postInstanceTestAttempts, expectedAttemptLength, expectedReasonStop, expectedFinalInitialStrategy, testIsBeingBurnedIn = true, isSuccessfulBurnIn = false) => {
  expect(postInstanceTestAttempts.length).to.eq(expectedAttemptLength)
  for (let i = 0; i < expectedAttemptLength; i++) {
    const { reasonToStop, initialStrategy } = postInstanceTestAttempts[i]

    // last attempt should have the expected initial strategy and reason to stop
    if (i === expectedAttemptLength - 1) {
      expect(reasonToStop).to.eq(expectedReasonStop)
      expect(initialStrategy).to.eq(expectedFinalInitialStrategy)
    } else if (i === 0) { // first attempt always has NONE strategy
      expect(reasonToStop).to.eq(null)
      expect(initialStrategy).to.eq('NONE')
    } else if ((i === 1 || isSuccessfulBurnIn) && testIsBeingBurnedIn) {
      // if test is being burned-in, the second attempt will always have BURN_IN strategy
      // or if it's being burned-in and all of its attempts are passing
      expect(reasonToStop).to.eq(null)
      expect(initialStrategy).to.eq('BURN_IN')
    } else {
    // if previous attempt failed, the current and following attempts will use retry strategy
      expect(reasonToStop).to.eq(null)
      expect(initialStrategy).to.eq('RETRY')
    }
  }
}

context('burn-in', () => {
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
        project: 'experimental-retries',
        spec: 'always-passes.cy.js',
        configFile: 'burn-in-no-retries.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 2, 'PASSED_BURN_IN', 'BURN_IN')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('PASSED_MET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-pass-on-threshold.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 5, 'PASSED_MET_THRESHOLD', 'RETRY')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_REACHED_MAX_RETRIES', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-always-fail-no-stop-if-any-passed.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 7, 'FAILED_REACHED_MAX_RETRIES', 'RETRY')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_DID_NOT_MEET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-high-pass-on-threshold.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 6, 'FAILED_DID_NOT_MEET_THRESHOLD', 'RETRY')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_STOPPED_ON_FLAKE', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-always-fail-stop-if-any-passed.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 2, 'FAILED_STOPPED_ON_FLAKE', 'BURN_IN')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
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
        project: 'experimental-retries',
        spec: 'always-passes.cy.js',
        configFile: 'burn-in-no-retries.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 2, 'PASSED_BURN_IN', 'BURN_IN')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('PASSED_MET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-pass-on-threshold.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 5, 'PASSED_MET_THRESHOLD', 'RETRY')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_REACHED_MAX_RETRIES', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-always-fail-no-stop-if-any-passed.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 7, 'FAILED_REACHED_MAX_RETRIES', 'RETRY')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_DID_NOT_MEET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-high-pass-on-threshold.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 6, 'FAILED_DID_NOT_MEET_THRESHOLD', 'RETRY')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_STOPPED_ON_FLAKE', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-always-fail-stop-if-any-passed.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 2, 'FAILED_STOPPED_ON_FLAKE', 'BURN_IN')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
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
        project: 'experimental-retries',
        spec: 'always-passes.cy.js',
        configFile: 'burn-in-no-retries.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 4, 'PASSED_BURN_IN', 'BURN_IN', true, true)

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('PASSED_MET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-pass-on-threshold.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 5, 'PASSED_MET_THRESHOLD', 'RETRY')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_REACHED_MAX_RETRIES', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-always-fail-no-stop-if-any-passed.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 7, 'FAILED_REACHED_MAX_RETRIES', 'RETRY')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_DID_NOT_MEET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-high-pass-on-threshold.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 6, 'FAILED_DID_NOT_MEET_THRESHOLD', 'RETRY')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_STOPPED_ON_FLAKE', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'passes-first-attempt-flaky.cy.js',
        configFile: 'burn-in-with-always-fail-stop-if-any-passed.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 2, 'FAILED_STOPPED_ON_FLAKE', 'BURN_IN')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
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
        project: 'experimental-retries',
        spec: 'always-passes.cy.js',
        configFile: 'burn-in-no-retries.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 1, 'PASSED_FIRST_ATTEMPT', 'NONE')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('PASSED_MET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'burn-in-with-pass-on-threshold.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 6, 'PASSED_MET_THRESHOLD', 'RETRY', false)

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_REACHED_MAX_RETRIES', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'burn-in-with-always-fail-no-stop-if-any-passed.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 7, 'FAILED_REACHED_MAX_RETRIES', 'RETRY', false)

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_DID_NOT_MEET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'burn-in-with-high-pass-on-threshold.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 5, 'FAILED_DID_NOT_MEET_THRESHOLD', 'RETRY', false)

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_STOPPED_ON_FLAKE', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'burn-in-with-always-fail-stop-if-any-passed.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 2, 'FAILED_STOPPED_ON_FLAKE', 'RETRY', false)

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
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
        project: 'experimental-retries',
        spec: 'always-passes.cy.js',
        configFile: 'burn-in-no-retries.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      // since the test passed in the first attempt and the test was already burned-in, we don't try to burn-in again
      assertAttempts(postInstanceTestAttempts, 1, 'PASSED_FIRST_ATTEMPT', 'NONE')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('PASSED_MET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'burn-in-with-pass-on-threshold.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 6, 'PASSED_MET_THRESHOLD', 'RETRY', false)

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_REACHED_MAX_RETRIES', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'burn-in-with-always-fail-no-stop-if-any-passed.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 7, 'FAILED_REACHED_MAX_RETRIES', 'RETRY', false)

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_DID_NOT_MEET_THRESHOLD', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'burn-in-with-high-pass-on-threshold.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 5, 'FAILED_DID_NOT_MEET_THRESHOLD', 'RETRY', false)

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })

    it('FAILED_STOPPED_ON_FLAKE', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'experimental-retries',
        spec: 'deterministic-flaky.cy.js',
        configFile: 'burn-in-with-always-fail-stop-if-any-passed.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 1,
        config: {
          screenshotOnRunFailure: false,
        },
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 2, 'FAILED_STOPPED_ON_FLAKE', 'RETRY', false)

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })
  })

  context('override default burn-in config', () => {
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
                  overrides: {
                    default: 3,
                    flaky: 5,
                  },
                },
                startingScore: null,
                planType: 'team',
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
        project: 'experimental-retries',
        spec: 'always-passes.cy.js',
        configFile: 'burn-in-no-retries.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 3, 'PASSED_BURN_IN', 'BURN_IN')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })
  })

  context('override burn-in not allowed', () => {
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
                  overrides: {
                    enabled: false,
                  },
                },
                startingScore: null,
                planType: 'free',
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
        project: 'experimental-retries',
        spec: 'always-passes.cy.js',
        configFile: 'burn-in-no-retries.config.js',
        record: true,
        snapshot: false,
        expectedExitCode: 0,
      })

      const requests = getRequests()

      assertRequestUrls()
      assertRunnerCapabilities(requests)

      const postInstanceTests = requests[3].body.tests

      expect(postInstanceTests.length).to.eq(1)

      const postInstanceTestAttempts = postInstanceTests[0].attempts

      assertAttempts(postInstanceTestAttempts, 1, 'PASSED_FIRST_ATTEMPT', 'NONE')

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })
  })
})
