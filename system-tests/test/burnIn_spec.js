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

const assertPassedMetThresholdWithoutBurnIn = (postInstanceTestAttempts) => {
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
  expect(postInstanceTestAttempts[5].reasonToStop).to.eq('PASSED_MET_THRESHOLD')
  expect(postInstanceTestAttempts[5].initialStrategy).to.eq('RETRY')
}

const assertFailedReachedMaxRetriesWithoutBurnIn = (postInstanceTestAttempts) => {
  expect(postInstanceTestAttempts.length).to.eq(7)
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
  expect(postInstanceTestAttempts[5].reasonToStop).to.eq(null)
  expect(postInstanceTestAttempts[5].initialStrategy).to.eq('RETRY')
  expect(postInstanceTestAttempts[6].reasonToStop).to.eq('FAILED_REACHED_MAX_RETRIES')
  expect(postInstanceTestAttempts[6].initialStrategy).to.eq('RETRY')
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

context('api burn-in actions', () => {
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

      assertPassedBurnIn(postInstanceTestAttempts)

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

      assertPassedMetThreshold(postInstanceTestAttempts)

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

      assertFailedReachedMaxRetries(postInstanceTestAttempts)

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

      assertFailedDidNotMeetThreshold(postInstanceTestAttempts)

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

      assertStoppedOnFlake(postInstanceTestAttempts)

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

      assertPassedBurnIn(postInstanceTestAttempts)

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

      assertPassedMetThreshold(postInstanceTestAttempts)

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

      assertFailedReachedMaxRetries(postInstanceTestAttempts)

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

      assertFailedDidNotMeetThreshold(postInstanceTestAttempts)

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

      assertStoppedOnFlake(postInstanceTestAttempts)

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

      expect(postInstanceTestAttempts.length).to.eq(4)
      expect(postInstanceTestAttempts[0].reasonToStop).to.eq(null)
      expect(postInstanceTestAttempts[0].initialStrategy).to.eq('NONE')
      expect(postInstanceTestAttempts[1].reasonToStop).to.eq(null)
      expect(postInstanceTestAttempts[1].initialStrategy).to.eq('BURN_IN')
      expect(postInstanceTestAttempts[2].reasonToStop).to.eq(null)
      expect(postInstanceTestAttempts[2].initialStrategy).to.eq('BURN_IN')
      expect(postInstanceTestAttempts[3].reasonToStop).to.eq('PASSED_BURN_IN')
      expect(postInstanceTestAttempts[3].initialStrategy).to.eq('BURN_IN')

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

      assertPassedMetThreshold(postInstanceTestAttempts)

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

      assertFailedReachedMaxRetries(postInstanceTestAttempts)

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

      assertFailedDidNotMeetThreshold(postInstanceTestAttempts)

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

      assertStoppedOnFlake(postInstanceTestAttempts)

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

      assertPassedFirstAttempt(postInstanceTestAttempts)

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

      assertPassedMetThresholdWithoutBurnIn(postInstanceTestAttempts)

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

      assertFailedReachedMaxRetriesWithoutBurnIn(postInstanceTestAttempts)

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

      assertFailedDidNotMeetThresholdWithoutBurnIn(postInstanceTestAttempts)

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

      assertFailedStoppedOnFlake(postInstanceTestAttempts)

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
      assertPassedFirstAttempt(postInstanceTestAttempts)

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

      assertPassedMetThresholdWithoutBurnIn(postInstanceTestAttempts)

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

      assertFailedReachedMaxRetriesWithoutBurnIn(postInstanceTestAttempts)

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

      assertFailedDidNotMeetThresholdWithoutBurnIn(postInstanceTestAttempts)

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

      assertFailedStoppedOnFlake(postInstanceTestAttempts)

      const normalizedAttempts = normalizeAttempts(postInstanceTestAttempts)

      systemTests.snapshot(normalizedAttempts)
    })
  })
})
