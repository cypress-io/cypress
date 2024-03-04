/* eslint-disable no-console */
const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')

const systemTests = require('../lib/system-tests').default
const { fs } = require('@packages/server/lib/util/fs')

const Fixtures = require('../lib/fixtures')
const { assertSchema } = require('../lib/validations/cloudValidations')
const {
  createRoutes,
  setupStubbedServer,
  getRequestUrls,
  getRequests,
  postRunResponse,
  postRunInstanceResponse,
  postInstanceTestsResponse,
  postRunResponseWithProtocolDisabled,
} = require('../lib/serverStub')
const { expectRunsToHaveCorrectTimings } = require('../lib/resultsUtils')
const e2ePath = Fixtures.projectPath('e2e')
const outputPath = path.join(e2ePath, 'output.json')

let { runId, groupId, machineId, runUrl, tags } = postRunResponse
const { instanceId } = postRunInstanceResponse

describe('e2e record', () => {
  context('passing', () => {
    setupStubbedServer(createRoutes())

    it('passes', async function () {
      const { stdout } = await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id-and-no-upload-on-pass-event.config.js',
        spec: 'record*',
        record: true,
        snapshot: true,
        outputPath,
        expectedExitCode: 3,
        config: {
          video: true,
          videoCompression: 32,
          env: {
            'TEST_STDIO': '1',
          },
        },
      })

      console.log(stdout)
      expect(stdout).to.include('Run URL:')
      expect(stdout).to.include(runUrl)

      const urls = getRequestUrls()
      const requests = getRequests()

      const instanceReqs = urls.slice(0, 26)

      expect(instanceReqs).to.deep.eq([
        // first create run request
        'POST /runs',

        // spec 1
        `POST /runs/${runId}/instances`,
        // no instances/:id/tests because spec failed during eval
        `POST /instances/${instanceId}/results`,
        'PUT /videos/video.mp4',
        `PUT /instances/${instanceId}/artifacts`,
        `PUT /instances/${instanceId}/stdout`,

        // spec 2
        `POST /runs/${runId}/instances`,
        `POST /instances/${instanceId}/tests`,
        `POST /instances/${instanceId}/results`,
        'PUT /videos/video.mp4',
        'PUT /screenshots/1.png',
        `PUT /instances/${instanceId}/artifacts`,
        `PUT /instances/${instanceId}/stdout`,

        // spec 3
        `POST /runs/${runId}/instances`,
        `POST /instances/${instanceId}/tests`,
        `POST /instances/${instanceId}/results`,
        // no video because no tests failed
        'PUT /screenshots/1.png',
        `PUT /instances/${instanceId}/artifacts`,
        `PUT /instances/${instanceId}/stdout`,

        // spec 4
        `POST /runs/${runId}/instances`,
        `POST /instances/${instanceId}/tests`,
        `POST /instances/${instanceId}/results`,
        'PUT /videos/video.mp4',
        'PUT /screenshots/1.png',
        `PUT /instances/${instanceId}/artifacts`,
        `PUT /instances/${instanceId}/stdout`,
      ])

      const postRun = requests[0]

      // ensure its relative to projectRoot
      expect(postRun.body.specs).to.deep.eq([
        'cypress/e2e/record_error.cy.js',
        'cypress/e2e/record_fail.cy.js',
        'cypress/e2e/record_pass.cy.js',
        'cypress/e2e/record_uncaught.cy.js',
      ])

      expect(postRun.body.projectId).to.eq('pid123')
      expect(postRun.body.recordKey).to.eq('f858a2bc-b469-4e48-be67-0876339ee7e1')
      expect(postRun.body.specPattern).to.eq('cypress/e2e/record*')
      expect(postRun.body.testingType).to.eq('e2e')

      const firstInstance = requests[1]

      expect(firstInstance.body.groupId).to.eq(groupId)
      expect(firstInstance.body.machineId).to.eq(machineId)
      expect(firstInstance.body.spec).to.eq(null)

      const firstInstancePostResults = requests[2]

      expect(firstInstancePostResults.body.exception).to.include('Oops...we found an error preparing this test file')
      expect(firstInstancePostResults.body.tests).to.be.null
      expect(firstInstancePostResults.body.hooks).to.not.exist
      expect(firstInstancePostResults.body.screenshots).to.have.length(0)
      expect(firstInstancePostResults.body.stats.tests).to.eq(0)
      expect(firstInstancePostResults.body.stats.failures).to.eq(1)
      expect(firstInstancePostResults.body.stats.passes).to.eq(0)

      const firstInstanceStdout = requests[5]

      expect(firstInstanceStdout.body.stdout).to.include('record_error.cy.js')

      const secondInstance = requests[6]

      expect(secondInstance.body.groupId).to.eq(groupId)
      expect(secondInstance.body.machineId).to.eq(machineId)
      expect(secondInstance.body.spec).to.eq(null)

      const secondInstancePostTests = requests[7].body

      expect(secondInstancePostTests.tests).length(2)
      expect(secondInstancePostTests.hooks).length(1)
      expect(secondInstancePostTests.config).is.an('object')

      const secondInstancePostResults = requests[8]

      expect(secondInstancePostResults.body.exception).to.be.null
      expect(secondInstancePostResults.body.tests).to.have.length(2)
      expect(secondInstancePostResults.body.screenshots).to.have.length(1)
      expect(secondInstancePostResults.body.stats.tests).to.eq(2)
      expect(secondInstancePostResults.body.stats.failures).to.eq(1)
      expect(secondInstancePostResults.body.stats.passes).to.eq(0)
      expect(secondInstancePostResults.body.stats.skipped).to.eq(1)
      expect(secondInstancePostResults.body.hooks).not.exist
      expect(secondInstancePostResults.body.cypressConfig).not.exist

      const secondInstanceStdout = requests[12]

      expect(secondInstanceStdout.body.stdout).to.include('record_fail.cy.js')
      expect(secondInstanceStdout.body.stdout).not.to.include('record_error.cy.js')

      const thirdInstance = requests[13]

      expect(thirdInstance.body.groupId).to.eq(groupId)
      expect(thirdInstance.body.machineId).to.eq(machineId)
      expect(thirdInstance.body.spec).to.eq(null)

      const thirdInstancePostTests = requests[14].body

      expect(thirdInstancePostTests.tests[0].config.env.foo).eq(true)
      expect(thirdInstancePostTests.tests).length(2)
      expect(thirdInstancePostTests.hooks).length(0)
      expect(thirdInstancePostTests.config).is.an('object')

      const thirdInstancePostResults = requests[15]

      expect(thirdInstancePostResults.body.exception).to.be.null
      expect(thirdInstancePostResults.body.tests).to.have.length(2)
      expect(thirdInstancePostResults.body.screenshots).to.have.length(1)
      expect(thirdInstancePostResults.body.stats.tests).to.eq(2)
      expect(thirdInstancePostResults.body.stats.passes).to.eq(1)
      expect(thirdInstancePostResults.body.stats.failures).to.eq(0)
      expect(thirdInstancePostResults.body.stats.pending).to.eq(1)

      const thirdInstanceStdout = requests[18]

      console.log('13')

      expect(thirdInstanceStdout.body.stdout).to.include('record_pass.cy.js')
      expect(thirdInstanceStdout.body.stdout).not.to.include('record_error.cy.js')
      expect(thirdInstanceStdout.body.stdout).not.to.include('record_fail.cy.js')
      expect(thirdInstanceStdout.body.stdout).to.include('plugin stdout')
      expect(thirdInstanceStdout.body.stdout).to.not.include('plugin stderr')

      const fourthInstance = requests[19]

      console.log('14')

      expect(fourthInstance.body.groupId).to.eq(groupId)
      expect(fourthInstance.body.machineId).to.eq(machineId)
      expect(fourthInstance.body.spec).to.eq(null)

      const fourthInstancePostResults = requests[21]

      console.log('15')

      expect(fourthInstancePostResults.body.exception).to.be.null
      expect(fourthInstancePostResults.body.tests).to.have.length(1)
      expect(fourthInstancePostResults.body.screenshots).to.have.length(1)
      expect(fourthInstancePostResults.body.stats.tests).to.eq(1)
      expect(fourthInstancePostResults.body.stats.failures).to.eq(1)
      expect(fourthInstancePostResults.body.stats.passes).to.eq(0)

      const forthInstanceStdout = requests[25]

      console.log('18')

      expect(forthInstanceStdout.body.stdout).to.include('record_uncaught.cy.js')
      expect(forthInstanceStdout.body.stdout).not.to.include('record_error.cy.js')
      expect(forthInstanceStdout.body.stdout).not.to.include('record_fail.cy.js')
      expect(forthInstanceStdout.body.stdout).not.to.include('record_pass.cy.js')

      let runs = requests.filter((v) => v.url.match(/POST \/instances\/.*\/results/) && v.body.tests).map((v) => v.body)

      expectRunsToHaveCorrectTimings(runs)

      runs = systemTests.normalizeRuns(runs)

      systemTests.snapshot(runs)

      const results = await fs.readJsonAsync(outputPath)

      expect(results.runUrl).to.equal(runUrl)
    })
  })

  context('parallelization', () => {
    const allSpecs = [
      'cypress/e2e/record_error.cy.js',
      'cypress/e2e/record_fail.cy.js',
      'cypress/e2e/record_pass.cy.js',
      'cypress/e2e/record_uncaught.cy.js',
    ]

    const postInstanceResponses = (specs) => {
      return _
      .chain(specs)
      .map((spec, i) => {
        return {
          spec,
          instanceId,
          estimatedWallClockDuration: (i + 1) * 1000,
        }
      })
      .concat({
        spec: null,
        instanceId: null,
        estimatedWallClockDuration: null,
      })
      .value()
    }

    // a1 does 3 specs, b2 does 1 spec
    const a1Specs = _.without(allSpecs, 'cypress/e2e/record_pass.cy.js')
    const b2Specs = _.difference(allSpecs, a1Specs)

    let firstRunResponse = false
    let waitUntilSecondInstanceClaims = null

    const claimed = []

    const responses = {
      a1: postInstanceResponses(a1Specs),
      b2: postInstanceResponses(b2Specs),
    }

    // replace the 1st + 2nd routes object
    const routes = createRoutes({
      postRun: {
        res (req, res) {
          let ciBuildId; let group;

          ({ group, tags, ciBuildId } = req.body)

          expect(group).to.eq('prod-e2e')
          expect(tags).to.deep.eq(['nightly'])
          expect(ciBuildId).to.eq('ciBuildId123')

          // if this is the first response
          // give machineId a1, else b2
          if (!firstRunResponse) {
            firstRunResponse = true
            machineId = 'a1ad2bcf-6398-46ed-b201-2fd90b188d5f'
          } else {
            machineId = 'b2bd2bcf-6398-46ed-b201-2fd90b188d5f'
          }

          return res.json(
            _.extend({}, postRunResponse, { machineId }),
          )
        },
      },
      postRunInstance: {
        res (req, res) {
          let spec;

          ({ machineId, spec } = req.body)

          expect(spec).to.be.null

          const mId = machineId.slice(0, 2)

          const respond = function () {
            const resp = responses[mId].shift()

            // if theres a spec to claim
            if (resp.spec) {
              claimed.push(resp)
            }

            resp.claimedInstances = claimed.length
            resp.totalInstances = allSpecs.length

            assertSchema('createInstance', 5, 'req')(resp)

            return res.json(resp)
          }

          // when the 1st machine attempts to claim its FIRST spec, we
          // automatically delay it until the 2nd machine claims its FIRST
          // spec so that the request URL's are deterministic
          if ((mId === 'a1') && (claimed.length === 0)) {
            waitUntilSecondInstanceClaims = function () {
              waitUntilSecondInstanceClaims = null

              return respond()
            }
          } else {
            respond()

            return (typeof waitUntilSecondInstanceClaims === 'function' ? waitUntilSecondInstanceClaims() : undefined)
          }
        },
      },
    })

    setupStubbedServer(routes)

    // TODO: fix failing test https://github.com/cypress-io/cypress/issues/23152
    it.skip('passes in parallel with group', function () {
      this.retries(3)

      return Promise.all([
        systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record*',
          group: 'prod-e2e',
          record: true,
          parallel: true,
          snapshot: true,
          tag: 'nightly',
          ciBuildId: 'ciBuildId123',
          expectedExitCode: 3,
          config: {
            video: true,
            videoCompression: 32,
            trashAssetsBeforeRuns: false,
          },
        })
        .then(({ stdout }) => stdout),

        // stagger the 2nd run
        // starting up a bit
        // NOTE: this is probably why this test flakes - despite waiting 3s, sometimes the second instance finishes first
        Promise
        .delay(3000)
        .then(() => {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record*',
            group: 'prod-e2e',
            record: true,
            parallel: true,
            snapshot: true,
            tag: 'nightly',
            ciBuildId: 'ciBuildId123',
            config: {
              videoCompression: 32,
              trashAssetsBeforeRuns: false,
            },
          })
          .then(({ stdout }) => stdout)
        }),
      ])
    })
  })

  context('metadata', () => {
    setupStubbedServer(createRoutes())

    // TODO: fix failing test https://github.com/cypress-io/cypress/issues/23151
    it.skip('sends Studio usage metadata', function () {
      return systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id.config.js',
        spec: 'studio_written.cy.js',
        record: true,
        snapshot: true,
      })
      .then(() => {
        const requests = getRequests()
        const postResults = requests[3]

        expect(postResults.url).to.eq(`POST /instances/${instanceId}/results`)

        expect(postResults.body.metadata.studioCreated).to.eq(2)
        expect(postResults.body.metadata.studioExtended).to.eq(4)
      })
    })
  })

  context('misconfiguration', () => {
    setupStubbedServer([])

    it('errors and exits when no specs found', function () {
      return systemTests.exec(this, {
        spec: 'notfound/**',
        snapshot: true,
        expectedExitCode: 1,
      })
      .then(() => {
        expect(getRequestUrls()).to.be.empty
      })
    })

    it('errors and exits when no browser found', function () {
      return systemTests.exec(this, {
        browser: 'browserDoesNotExist',
        spec: 'record_pass*',
        snapshot: true,
        expectedExitCode: 1,
      })
      .then(() => {
        expect(getRequestUrls()).to.be.empty
      })
    })
  })

  context('empty specs', () => {
    setupStubbedServer(createRoutes())

    // https://github.com/cypress-io/cypress/issues/15512
    it('succeeds when empty spec file', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id.config.js',
        record: true,
        spec: 'empty_suite.cy.js,empty.cy.js',
        snapshot: true,
        expectedExitCode: 0,
      })

      expect(getRequestUrls()).deep.eq([
        'POST /runs',
        `POST /runs/${runId}/instances`,
        `POST /instances/${instanceId}/tests`,
        `POST /instances/${instanceId}/results`,
        `PUT /instances/${instanceId}/artifacts`,
        `PUT /instances/${instanceId}/stdout`,
        `POST /runs/${runId}/instances`,
        `POST /instances/${instanceId}/tests`,
        `POST /instances/${instanceId}/results`,
        `PUT /instances/${instanceId}/artifacts`,
        `PUT /instances/${instanceId}/stdout`,
        `POST /runs/${runId}/instances`,
      ])
    })
  })

  context('projectId', () => {
    systemTests.setup()

    it('errors and exits without projectId', function () {
      return systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        spec: 'record_pass*',
        record: true,
        snapshot: true,
        expectedExitCode: 1,
      })
    })
  })

  context('quiet mode', () => {
    setupStubbedServer(createRoutes())

    it('respects quiet mode', function () {
      return systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        record: true,
        snapshot: true,
        expectedExitCode: 0,
        quiet: true,
      })
    })
  })

  context('recordKey', () => {
    setupStubbedServer(createRoutes())

    it('errors and exits without recordKey', function () {
      return systemTests.exec(this, {
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        record: true,
        snapshot: true,
        expectedExitCode: 1,
      })
      .then(() => {
        expect(getRequestUrls()).to.be.empty
      })
    })

    it('warns but does not exit when is forked pr', function () {
      process.env.CIRCLECI = 'true'
      process.env.CIRCLE_PR_NUMBER = '123'
      process.env.CIRCLE_PR_USERNAME = 'brian-mann'
      process.env.CIRCLE_PR_REPONAME = 'cypress'
      process.env.CYPRESS_INTERNAL_SYSTEM_TESTS = '0'

      return systemTests.exec(this, {
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        record: true,
        snapshot: true,
      })
      .then(() => {
        console.log('GETREQUESTURLS', getRequestUrls())

        expect(getRequestUrls()).to.be.empty
      })
    })

    it('warns but does not exit when is forked pr and parallel', function () {
      process.env.CIRCLECI = 'true'
      process.env.CIRCLE_WORKFLOW_ID = '123'
      process.env.CIRCLE_PR_NUMBER = '123'
      process.env.CIRCLE_PR_USERNAME = 'brian-mann'
      process.env.CIRCLE_PR_REPONAME = 'cypress'
      process.env.CYPRESS_INTERNAL_SYSTEM_TESTS = '0'

      return systemTests.exec(this, {
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        record: true,
        parallel: true,
        snapshot: true,
      })
      .then(() => {
        expect(getRequestUrls()).to.be.empty
      })
    })
  })

  context('test configuration', () => {
    setupStubbedServer(createRoutes())

    it('config from runtime, testOptions', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id-without-video.config.js',
        spec: 'config_record.cy.js',
        record: true,
        snapshot: false,

      })

      const requests = getRequests()

      expect(requests[2].body.config.defaultCommandTimeout).eq(1111)
      expect(requests[2].body.config.resolved.defaultCommandTimeout).deep.eq({
        value: 1111,
        from: 'runtime',
      })

      expect(requests[2].body.config.pageLoadTimeout).eq(3333)
      expect(requests[2].body.config.resolved.pageLoadTimeout).deep.eq({
        value: 3333,
        from: 'runtime',
      })

      expect(requests[2].body.tests[0].config).deep.eq({
        defaultCommandTimeout: 1234,
        env: { foo: true },
        retries: 2,
      })

      expect(requests[2].body.tests[1].title).deep.eq([
        'record pass',
        'is pending',
      ])

      expect(requests[2].body.tests[1].body).to.eq('')

      expect(requests[2].body.tests[2].title).deep.eq([
        'record pass',
        'is pending due to .skip',
      ])

      expect(requests[2].body.tests[2].body).to.eq('() => {\n    console.log(\'stuff\');\n  }')

      expect(requests[2].body.tests[3].title).deep.eq([
        'record pass',
        'is skipped due to browser',
      ])

      expect(requests[2].body.tests[3].body).eq('() => {}')

      expect(requests[2].body.tests[3].config).deep.eq({
        defaultCommandTimeout: 1234,
        browser: 'edge',
      })
    })
  })

  context('record in non-parallel', () => {
    describe('api reordering specs', () => {
      let mockServerState

      mockServerState = setupStubbedServer(createRoutes({
        postRun: {
          res (req, res) {
            console.log(req.body.specs)
            mockServerState.specs = req.body.specs.slice().reverse()
            console.log(mockServerState.specs)
            mockServerState.allSpecs = req.body.specs
            res.json(postRunResponseWithProtocolDisabled())
          },
        },
      }))

      it('changes spec run order', async function () {
        await systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id-without-video.config.js',
          spec: 'a_record.cy.js,b_record.cy.js',
          record: true,
          snapshot: false,
        })

        const requests = getRequests()

        // specs were reordered
        expect(requests[2].body.tests[0].title[1]).eq('b test')
        expect(requests[7].body.tests[0].title[1]).eq('a test')
      })
    })
  })

  describe('api skips specs', () => {
    let mockServerState = setupStubbedServer(createRoutes({

      postInstanceTests: {
        res: (req, res) => {
          console.log(mockServerState.specs)
          if (mockServerState.specs.length > 0) {
            return res.json({
              ...postInstanceTestsResponse,
              actions: [{
                type: 'SPEC',
                clientId: null,
                payload: null,
                action: 'SKIP',
              }],
            })
          }

          return res.json({
            ...postInstanceTestsResponse,
            actions: [],
          })
        },
      },

    }))

    it('records tests and exits without executing', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id-without-video.config.js',
        spec: 'a_record_instantfail.cy.js,b_record.cy.js',
        record: true,
        snapshot: true,
        expectedExitCode: 1,
      })

      const requests = getRequests()

      expect(getRequestUrls()).deep.eq([
        'POST /runs',
        'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
        'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
        'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
        'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
        'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/results',
        'PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/artifacts',
        'PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/stdout',
        'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
      ])

      console.log(requests[0].body.runnerCapabilities)
      expect(requests[0].body).property('runnerCapabilities').deep.eq({
        'dynamicSpecsInSerialMode': true,
        'protocolMountVersion': 2,
        'skipSpecAction': true,
      })
    })

    it('records tests and exits without executing in parallel', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id-without-video.config.js',
        spec: 'a_record_instantfail.cy.js,b_record.cy.js',
        record: true,
        snapshot: true,
        group: 'abc',
        parallel: true,
        ciBuildId: 'ciBuildId123',
        expectedExitCode: 1,
      })

      expect(getRequestUrls()).deep.eq([
        'POST /runs',
        'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
        'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
        'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
        'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
        'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/results',
        'PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/artifacts',
        'PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/stdout',
        'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
      ])
    })
  })

  context('video recording', () => {
    describe('when video=false', () => {
      setupStubbedServer(createRoutes())

      it('does not upload when not enabled', async function () {
        const { stdout } = await systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id-without-video.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
          config: {
            env: {
              'TEST_STDIO': '1',
            },
          },
        })
        const requests = getRequests()

        console.log(stdout)

        expect(stdout).to.include('Run URL:')
        expect(stdout).to.include(runUrl)

        const postRun = requests[0]

        // ensure its relative to projectRoot
        expect(postRun.body.specs).to.deep.eq([
          'cypress/e2e/record_pass.cy.js',
        ])

        const runResults = requests[3]

        expect(runResults.body.video).to.be.false
      })
    })
  })
})
