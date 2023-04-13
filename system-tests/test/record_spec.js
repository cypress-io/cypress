/* eslint-disable no-console */
const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const jsonSchemas = require('@cypress/json-schemas').api
const dedent = require('dedent')

const systemTests = require('../lib/system-tests').default
const { fs } = require('@packages/server/lib/util/fs')
const Fixtures = require('../lib/fixtures')
const {
  createRoutes,
  setupStubbedServer,
  getRequestUrls,
  getRequests,
  postRunResponse,
  postRunResponseWithWarnings,
  postRunInstanceResponse,
  postInstanceTestsResponse,
  encryptBody,
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
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record*',
        record: true,
        snapshot: true,
        outputPath,
        expectedExitCode: 3,
        config: {
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

      const instanceReqs = urls.slice(0, 22)

      expect(instanceReqs).to.deep.eq([
        // first create run request
        'POST /runs',

        // spec 1
        `POST /runs/${runId}/instances`,
        // no instances/:id/tests because spec failed during eval
        `POST /instances/${instanceId}/results`,
        'PUT /videos/video.mp4',
        `PUT /instances/${instanceId}/stdout`,

        // spec 2
        `POST /runs/${runId}/instances`,
        `POST /instances/${instanceId}/tests`,
        `POST /instances/${instanceId}/results`,
        'PUT /videos/video.mp4',
        'PUT /screenshots/1.png',
        `PUT /instances/${instanceId}/stdout`,

        // spec 3
        `POST /runs/${runId}/instances`,
        `POST /instances/${instanceId}/tests`,
        `POST /instances/${instanceId}/results`,
        // no video because no tests failed
        'PUT /screenshots/1.png',
        `PUT /instances/${instanceId}/stdout`,

        // spec 4
        `POST /runs/${runId}/instances`,
        `POST /instances/${instanceId}/tests`,
        `POST /instances/${instanceId}/results`,
        'PUT /videos/video.mp4',
        'PUT /screenshots/1.png',
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

      const firstInstanceStdout = requests[4]

      expect(firstInstanceStdout.body.stdout).to.include('record_error.cy.js')

      const secondInstance = requests[5]

      expect(secondInstance.body.groupId).to.eq(groupId)
      expect(secondInstance.body.machineId).to.eq(machineId)
      expect(secondInstance.body.spec).to.eq(null)

      const secondInstancePostTests = requests[6].body

      expect(secondInstancePostTests.tests).length(2)
      expect(secondInstancePostTests.hooks).length(1)
      expect(secondInstancePostTests.config).is.an('object')

      const secondInstancePostResults = requests[7]

      expect(secondInstancePostResults.body.exception).to.be.null
      expect(secondInstancePostResults.body.tests).to.have.length(2)
      expect(secondInstancePostResults.body.screenshots).to.have.length(1)
      expect(secondInstancePostResults.body.stats.tests).to.eq(2)
      expect(secondInstancePostResults.body.stats.failures).to.eq(1)
      expect(secondInstancePostResults.body.stats.passes).to.eq(0)
      expect(secondInstancePostResults.body.stats.skipped).to.eq(1)
      expect(secondInstancePostResults.body.hooks).not.exist
      expect(secondInstancePostResults.body.cypressConfig).not.exist

      const secondInstanceStdout = requests[10]

      expect(secondInstanceStdout.body.stdout).to.include('record_fail.cy.js')
      expect(secondInstanceStdout.body.stdout).not.to.include('record_error.cy.js')

      const thirdInstance = requests[11]

      expect(thirdInstance.body.groupId).to.eq(groupId)
      expect(thirdInstance.body.machineId).to.eq(machineId)
      expect(thirdInstance.body.spec).to.eq(null)

      const thirdInstancePostTests = requests[12].body

      expect(thirdInstancePostTests.tests[0].config.env.foo).eq(true)
      expect(thirdInstancePostTests.tests).length(2)
      expect(thirdInstancePostTests.hooks).length(0)
      expect(thirdInstancePostTests.config).is.an('object')

      const thirdInstancePostResults = requests[13]

      expect(thirdInstancePostResults.body.exception).to.be.null
      expect(thirdInstancePostResults.body.tests).to.have.length(2)
      expect(thirdInstancePostResults.body.screenshots).to.have.length(1)
      expect(thirdInstancePostResults.body.stats.tests).to.eq(2)
      expect(thirdInstancePostResults.body.stats.passes).to.eq(1)
      expect(thirdInstancePostResults.body.stats.failures).to.eq(0)
      expect(thirdInstancePostResults.body.stats.pending).to.eq(1)

      const thirdInstanceStdout = requests[15]

      console.log('13')

      expect(thirdInstanceStdout.body.stdout).to.include('record_pass.cy.js')
      expect(thirdInstanceStdout.body.stdout).not.to.include('record_error.cy.js')
      expect(thirdInstanceStdout.body.stdout).not.to.include('record_fail.cy.js')
      expect(thirdInstanceStdout.body.stdout).to.include('plugin stdout')
      expect(thirdInstanceStdout.body.stdout).to.not.include('plugin stderr')

      const fourthInstance = requests[16]

      console.log('14')

      expect(fourthInstance.body.groupId).to.eq(groupId)
      expect(fourthInstance.body.machineId).to.eq(machineId)
      expect(fourthInstance.body.spec).to.eq(null)

      const fourthInstancePostResults = requests[18]

      console.log('15')

      expect(fourthInstancePostResults.body.exception).to.be.null
      expect(fourthInstancePostResults.body.tests).to.have.length(1)
      expect(fourthInstancePostResults.body.screenshots).to.have.length(1)
      expect(fourthInstancePostResults.body.stats.tests).to.eq(1)
      expect(fourthInstancePostResults.body.stats.failures).to.eq(1)
      expect(fourthInstancePostResults.body.stats.passes).to.eq(0)

      const forthInstanceStdout = requests[21]

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

            jsonSchemas.assertSchema('postRunInstanceResponse', '2.1.0')(resp)

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
        `PUT /instances/${instanceId}/stdout`,

        `POST /runs/${runId}/instances`,
        `POST /instances/${instanceId}/tests`,
        `POST /instances/${instanceId}/results`,
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
            res.json(postRunResponse)
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
        expect(requests[6].body.tests[0].title[1]).eq('a test')
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
        'PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/stdout',
        'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
      ])

      console.log(requests[0].body.runnerCapabilities)
      expect(requests[0].body).property('runnerCapabilities').deep.eq({
        'dynamicSpecsInSerialMode': true,
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

    describe('when videoUploadOnPasses=false', () => {
      setupStubbedServer(createRoutes())
      it('does not upload when specs pass', async function () {
        const { stdout } = await systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_fail*,record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
          config: {
            videoCompression: 32,
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
          'cypress/e2e/record_fail.cy.js',
          'cypress/e2e/record_pass.cy.js',
        ])

        const recordFailSpecResults = requests[3]

        expect(recordFailSpecResults.body.video).to.be.true // failed spec has video

        const recordPassSpecResults = requests[9]

        expect(recordPassSpecResults.body.video).to.be.false // passing spec does not have video
      })
    })
  })

  context('api interaction errors', () => {
    describe('recordKey and projectId', () => {
      const routes = createRoutes({
        postRun: {
          res (req, res) {
            return res.sendStatus(401)
          },
        },
      })

      setupStubbedServer(routes)

      it('errors and exits on 401', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
      })
    })

    describe('project 404', () => {
      const routes = createRoutes({
        postRun: {
          res (req, res) {
            return res.sendStatus(404)
          },
        },
      })

      setupStubbedServer(routes)

      it('errors and exits', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
      })
    })

    describe('create run 500', () => {
      const routes = createRoutes({
        postRun: {
          res (req, res) {
            return res.sendStatus(500)
          },
        },
      })

      setupStubbedServer(routes)

      it('errors and exits', function () {
        process.env.DISABLE_API_RETRIES = 'true'

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
          ])
        })
      })

      it('when grouping without parallelization errors and exits', function () {
        process.env.DISABLE_API_RETRIES = 'true'

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          group: 'foo',
          record: true,
          snapshot: true,
          ciBuildId: 'ciBuildId123',
          expectedExitCode: 1,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
          ])
        })
      })

      it('does not proceed and exits with error when parallelizing', function () {
        process.env.DISABLE_API_RETRIES = 'true'

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          group: 'foo',
          tag: 'nightly',
          record: true,
          parallel: true,
          snapshot: true,
          ciBuildId: 'ciBuildId123',
          expectedExitCode: 1,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
          ])
        })
      })
    })

    describe('create instance 500', () => {
      const routes = createRoutes({
        postRunInstance: {
          res (req, res) {
            return res.sendStatus(500)
          },
        },
      })

      setupStubbedServer(_.values(routes))

      it('does not proceed and exits with error when parallelizing and creating instance', function () {
        process.env.DISABLE_API_RETRIES = 'true'

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          group: 'foo',
          tag: 'nightly',
          record: true,
          parallel: true,
          snapshot: true,
          ciBuildId: 'ciBuildId123',
          expectedExitCode: 1,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
            `POST /runs/${runId}/instances`,
          ])
        })
      })

      it('without parallelization - does not proceed', async function () {
        process.env.DISABLE_API_RETRIES = 'true'

        await systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'a_record.cy.js,b_record.cy.js',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
            'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
          ])
        })
      })
    })

    describe('update instance 500', () => {
      const routes = createRoutes({
        postRunInstance: {
          res (req, res) {
            return res.json({
              instanceId,
              spec: 'cypress/e2e/record_pass.cy.js',
              estimatedWallClockDuration: 5000,
              totalInstances: 1,
              claimedInstances: 1,
            })
          },
        },
        postInstanceResults: {
          res (req, res) {
            return res.sendStatus(500)
          },
        },
      })

      setupStubbedServer(routes)

      it('does not proceed and exits with error when parallelizing and updating instance', function () {
        process.env.DISABLE_API_RETRIES = 'true'

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          group: 'foo',
          tag: 'nightly',
          record: true,
          parallel: true,
          snapshot: true,
          ciBuildId: 'ciBuildId123',
          expectedExitCode: 1,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
            `POST /runs/${runId}/instances`,
            'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
            'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/results',
          ])
        })
      })
    })

    describe('create run 422', () => {
      setupStubbedServer(createRoutes({
        postRun: {
          res (req, res) {
            return res.status(422).json({
              code: 'RUN_GROUP_NAME_NOT_UNIQUE',
              message: 'Run group name cannot be used again without passing the parallel flag.',
              payload: {
                runUrl: 'https://cloud.cypress.io/runs/12345',
              },
            })
          },
        },
      }))

      // the other 422 tests for this are in integration/cypress_spec
      it('errors and exits when group name is in use', function () {
        process.env.CIRCLECI = '1'

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          group: 'e2e-tests',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
          ])
        })
      })
    })

    describe('create run 412', () => {
      setupStubbedServer(createRoutes({
        postRun: {
          reqSchema: 'postRunRequest@2.0.0', // force this to throw a schema error
          onReqBody (body) {
            _.extend(body, {
              ci: null,
              commit: null,
              ciBuildId: null,
              platform: null,
            })
          },
        },
      }))

      it('errors and exits when request schema is invalid', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          spec: 'record_pass*',
          configFile: 'cypress-with-project-id.config.js',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.be.empty
        })
      })
    })

    describe('create run unknown 422', () => {
      setupStubbedServer(createRoutes({
        postRun: {
          res (req, res) {
            return res.status(422).json({
              code: 'SOMETHING_UNKNOWN',
              message: 'An unknown message here from the server.',
            })
          },
        },
      }))

      it('errors and exits when there is an unknown 422 response', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          group: 'e2e-tests',
          tag: 'nightly',
          record: true,
          parallel: true,
          snapshot: true,
          ciBuildId: 'ciBuildId123',
          expectedExitCode: 1,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
          ])
        })
      })
    })

    describe('create run 402 - free plan exceeds monthly private tests', () => {
      setupStubbedServer(createRoutes({
        postRun: {
          res (req, res) {
            return res.status(402).json({
              code: 'FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS',
              payload: {
                used: 600,
                limit: 500,
                orgId: 'org-id-1234',
              },
            })
          },
        },
      }))

      it('errors and exits when on free plan and over recorded runs limit', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
      })
    })

    describe('create run 402 - free plan exceeds monthly tests', () => {
      setupStubbedServer(createRoutes({
        postRun: {
          res (req, res) {
            return res.status(402).json({
              code: 'FREE_PLAN_EXCEEDS_MONTHLY_TESTS',
              payload: {
                used: 600,
                limit: 500,
                orgId: 'org-id-1234',
              },
            })
          },
        },
      }))

      it('errors and exits when on free plan and over recorded tests limit', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
      })
    })

    describe('create run 402 - parallel feature not available in plan', () => {
      setupStubbedServer(createRoutes({
        postRun: {
          res (req, res) {
            return res.status(402).json({
              code: 'PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN',
              payload: {
                orgId: 'org-id-1234',
              },
            })
          },
        } }))

      it('errors and exits when attempting parallel run when not available in plan', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
      })
    })

    describe('create run 402 - grouping feature not available in plan', () => {
      setupStubbedServer(createRoutes({ postRun: {
        res (req, res) {
          return res.status(402).json({
            code: 'RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN',
            payload: {
              orgId: 'org-id-1234',
            },
          })
        },
      } }))

      it('errors and exits when attempting parallel run when not available in plan', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
      })
    })

    describe('create run 402 - unknown error', () => {
      setupStubbedServer(createRoutes({ postRun: {
        res (req, res) {
          return res.status(402).json({
            error: 'Something went wrong',
          })
        },
      } }))

      it(`errors and exits when there's an unknown 402 error`, function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
      })
    })

    describe('create run 402 - auto cancel not available in plan', () => {
      setupStubbedServer(createRoutes({
        postRun: {
          res (req, res) {
            return res.status(402).json({
              code: 'AUTO_CANCEL_NOT_AVAILABLE_IN_PLAN',
              payload: {
                orgId: 'org-id-1234',
              },
            })
          },
        } }))

      it('errors and exits when auto cancel not available in plan', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
      })
    })

    describe('create instance', () => {
      setupStubbedServer(createRoutes({
        postRunInstance: {
          res (req, res) {
            return res.sendStatus(500)
          },
        },
      }))

      it('errors and exits on createInstance error', function () {
        process.env.DISABLE_API_RETRIES = 'true'

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'a_record_instantfail.cy.js',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
            `POST /runs/${runId}/instances`,
          ])
        })
      })
    })

    describe('postInstanceTests', () => {
      setupStubbedServer(createRoutes({
        postInstanceTests: {
          res (req, res) {
            res.sendStatus(500)
          },
        },
      }))

      // it('without parallelization continues, does not post instance results', async function () {
      //   process.env.DISABLE_API_RETRIES = 'true'

      //   return systemTests.exec(this, {
      //     key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
      //     configFile: 'cypress-with-project-id.config.js',
      //     spec: '*_record.spec*',
      //     record: true,
      //     snapshot: true,
      //   })
      //   .then(() => {
      //     const urls = getRequestUrls()

      //     expect(urls).to.deep.eq([
      //       'POST /runs',
      //       'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
      //       'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
      //       'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
      //       'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
      //     ])
      //   })
      // })

      it('without parallelization errors and exits', async function () {
        process.env.DISABLE_API_RETRIES = 'true'

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'a_record.cy.js,b_record.cy.js',
          group: 'foo',
          ciBuildId: 1,
          expectedExitCode: 1,
          record: true,
          snapshot: true,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
            'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
            'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
          ])
        })
      })

      it('with parallelization errors and exits', async function () {
        process.env.DISABLE_API_RETRIES = 'true'

        await systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'a_record.cy.js,b_record.cy.js',
          record: true,
          group: 'foo',
          ciBuildId: 'ciBuildId123',
          expectedExitCode: 1,
          parallel: true,
          snapshot: true,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
            'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
            'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
          ])
        })
      })
    })

    describe('postInstanceResults', () => {
      const routes = createRoutes({
        postInstanceResults: {
          res (req, res) {
            return res.sendStatus(500)
          },
        },
      })

      setupStubbedServer(routes)

      it('errors and exits in serial', function () {
        process.env.DISABLE_API_RETRIES = 'true'

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
            `POST /runs/${runId}/instances`,
            `POST /instances/${instanceId}/tests`,
            `POST /instances/${instanceId}/results`,
          ])
        })
      })
    })

    describe('update instance stdout', () => {
      const routes = createRoutes({
        putInstanceStdout: {
          res (req, res) {
            return res.sendStatus(500)
          },
        },
      })

      setupStubbedServer(routes)

      it('warns but proceeds', function () {
        process.env.DISABLE_API_RETRIES = 'true'

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
            `POST /runs/${runId}/instances`,
            `POST /instances/${instanceId}/tests`,
            `POST /instances/${instanceId}/results`,
            'PUT /screenshots/1.png',
            `PUT /instances/${instanceId}/stdout`,
            `POST /runs/${runId}/instances`,
          ])
        })
      })
    })

    describe('uploading assets', () => {
      const routes = createRoutes({

        putVideo: {
          res (req, res) {
            return Promise.delay(500)
            .then(() => {
              return res.sendStatus(500)
            })
          },
        },
        putScreenshots: {
          res (req, res) {
            return res.sendStatus(500)
          },
        },
      })

      setupStubbedServer(routes)

      it('warns but proceeds', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id-uploading-assets.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.have.members([
            'POST /runs',
            `POST /runs/${runId}/instances`,
            `POST /instances/${instanceId}/tests`,
            `POST /instances/${instanceId}/results`,
            'PUT /videos/video.mp4',
            'PUT /screenshots/1.png',
            `PUT /instances/${instanceId}/stdout`,
          ])
        })
      })
    })

    describe('api retries on error', () => {
      let count = 0

      const routes = createRoutes({
        postRun: {
          res (req, res) {
            count += 1

            if (count === 4) {
              return res.json(postRunResponse)
            }

            return res.sendStatus(500)
          },
        },
        postRunInstance: {
          res (req, res) {
            count += 1

            if (count === 5) {
              return res.sendStatus(500)
            }

            if (count === 6) {
              return res.json({
                instanceId,
                spec: 'cypress/e2e/record_pass.cy.js',
                estimatedWallClockDuration: 5000,
                totalInstances: 1,
                claimedInstances: 1,
              })
            }

            return res.json({
              instanceId,
              spec: null,
              estimatedWallClockDuration: null,
              totalInstances: 0,
              claimedInstances: 0,
            })
          },
        },

      })

      setupStubbedServer(routes)

      it('warns and does not create or update instances', function () {
        process.env.API_RETRY_INTERVALS = '1000,2000,3000'

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          group: 'foo',
          tag: 'nightly',
          record: true,
          parallel: true,
          snapshot: true,
          ciBuildId: 'ciBuildId123',
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
            'POST /runs',
            'POST /runs',
            'POST /runs',
            'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
            'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
            'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/tests',
            'POST /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/results',
            'PUT /screenshots/1.png',
            'PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/stdout',
            'POST /runs/00748421-e035-4a3d-8604-8468cc48bdb5/instances',
          ])
        })
      })
    })

    describe('sendPreflight', () => {
      describe('[F1] socket errors', () => {
        setupStubbedServer(createRoutes({
          sendPreflight: {
            res (req, res) {
              return req.socket.destroy(new Error('killed'))
            },
          },
        }))

        it('fails after retrying', function () {
          process.env.API_RETRY_INTERVALS = '1000'

          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            group: 'foo',
            tag: 'nightly',
            record: true,
            parallel: true,
            snapshot: true,
            ciBuildId: 'ciBuildId123',
            expectedExitCode: 1,
          })
        })
      })

      describe('[F1] 500 status code errors with empty body', () => {
        setupStubbedServer(createRoutes({
          sendPreflight: {
            res (req, res) {
              return res.sendStatus(500)
            },
          },
        }))

        it('fails after retrying', function () {
          process.env.API_RETRY_INTERVALS = '1000'

          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            group: 'foo',
            tag: 'nightly',
            record: true,
            parallel: true,
            snapshot: true,
            ciBuildId: 'ciBuildId123',
            expectedExitCode: 1,
          })
        })
      })

      describe('[F1] 500 status code errors with body', () => {
        setupStubbedServer(createRoutes({
          sendPreflight: {
            res (req, res) {
              return res
              .status(500)
              .json({ message: 'an error message' })
            },
          },
        }))

        it('fails after retrying', function () {
          process.env.API_RETRY_INTERVALS = '1000'

          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            group: 'foo',
            tag: 'nightly',
            record: true,
            parallel: true,
            snapshot: true,
            ciBuildId: 'ciBuildId123',
            expectedExitCode: 1,
          })
        })
      })

      describe('[F2] 404 status code with JSON body', () => {
        setupStubbedServer(createRoutes({
          sendPreflight: {
            res (req, res) {
              return res
              .status(404)
              .json({ message: 'not found' })
            },
          },
        }))

        it('fails without retrying', function () {
          process.env.API_RETRY_INTERVALS = '1000'

          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            group: 'foo',
            tag: 'nightly',
            record: true,
            parallel: true,
            snapshot: true,
            ciBuildId: 'ciBuildId123',
            expectedExitCode: 1,
          })
        })
      })

      describe('[F2] 404 status code with empty body', () => {
        setupStubbedServer(createRoutes({
          sendPreflight: {
            res (req, res) {
              return res.sendStatus(404)
            },
          },
        }))

        it('fails without retrying', function () {
          process.env.API_RETRY_INTERVALS = '1000'

          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            group: 'foo',
            tag: 'nightly',
            record: true,
            parallel: true,
            snapshot: true,
            ciBuildId: 'ciBuildId123',
            expectedExitCode: 1,
          })
        })
      })

      describe('[F3] 422 status code with invalid decryption', () => {
        setupStubbedServer(createRoutes({
          sendPreflight: {
            res: async (req, res) => {
              return res.status(422).json({
                message: 'something broke',
              })
            },
          },
        }))

        it('fails without retrying', function () {
          process.env.API_RETRY_INTERVALS = '1000'

          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            group: 'foo',
            tag: 'nightly',
            record: true,
            parallel: true,
            snapshot: true,
            ciBuildId: 'ciBuildId123',
            expectedExitCode: 1,
          })
        })
      })

      describe('[F3] 201 status code with invalid decryption', () => {
        setupStubbedServer(createRoutes({
          sendPreflight: {
            res (req, res) {
              return res
              .status(201)
              .json({ data: 'very encrypted and secure string' })
            },
          },
        }))

        it('fails without retrying', function () {
          process.env.API_RETRY_INTERVALS = '1000'

          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            group: 'foo',
            tag: 'nightly',
            record: true,
            parallel: true,
            snapshot: true,
            ciBuildId: 'ciBuildId123',
            expectedExitCode: 1,
          })
        })
      })

      describe('[F3] 200 status code with empty body', () => {
        setupStubbedServer(createRoutes({
          sendPreflight: {
            res (req, res) {
              return res.sendStatus(200)
            },
          },
        }))

        it('fails without retrying', function () {
          process.env.API_RETRY_INTERVALS = '1000'

          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            group: 'foo',
            tag: 'nightly',
            record: true,
            parallel: true,
            snapshot: true,
            ciBuildId: 'ciBuildId123',
            expectedExitCode: 1,
          })
        })
      })

      describe('[F4] 412 status code with valid decryption', () => {
        setupStubbedServer(createRoutes({
          sendPreflight: {
            res: async (req, res) => {
              return res.status(412).json(await encryptBody(req, res, {
                message: 'Recording is not working',
                errors: [
                  'attempted to send invalid data',
                ],
                object: {
                  projectId: 'cy12345',
                },
              }))
            },
          },
        }))

        it('fails without retrying', function () {
          process.env.API_RETRY_INTERVALS = '1000'

          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            group: 'foo',
            tag: 'nightly',
            record: true,
            parallel: true,
            snapshot: true,
            ciBuildId: 'ciBuildId123',
            expectedExitCode: 1,
          })
        })
      })

      describe('[F5] 422 status code with valid decryption on createRun', async () => {
        const mockServer = setupStubbedServer(createRoutes({
          sendPreflight: {
            res: async (req, res) => {
              return res.json(await encryptBody(req, res, {
                encrypt: true,
                apiUrl: req.body.apiUrl,
              }))
            },
          },
          postRun: {
            res: async (req, res) => {
              mockServer.setSpecs(req)

              return res
              .set({ 'x-cypress-encrypted': true })
              .status(422)
              .json(await encryptBody(req, res, {
                code: 'RUN_GROUP_NAME_NOT_UNIQUE',
                message: 'Run group name cannot be used again without passing the parallel flag.',
                payload: {
                  runUrl: 'https://cloud.cypress.io/runs/12345',
                },
              }))
            },
          },
        }))

        // the other 422 tests for this are in integration/cypress_spec
        it('errors and exits when group name is in use', function () {
          process.env.CIRCLECI = '1'

          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            group: 'e2e-tests',
            record: true,
            snapshot: true,
            expectedExitCode: 1,
          })
          .then(() => {
            const urls = getRequestUrls()

            expect(urls).to.deep.eq([
              'POST /runs',
            ])
          })
        })
      })

      describe('[W1] warning message', () => {
        const mockServer = setupStubbedServer(createRoutes({
          sendPreflight: {
            res: async (req, res) => {
              return res.json(await encryptBody(req, res, {
                encrypt: true,
                apiUrl: req.body.apiUrl,
                warnings: [
                  {
                    message: dedent`
                    ----------------------------------------------------------------------
                    This feature will not be supported soon, please check with Cypress to learn more: https://on.cypress.io/
                    ----------------------------------------------------------------------
                  `,
                  },
                ],
              }))
            },
          },
          postRun: {
            res (req, res) {
              mockServer.setSpecs(req)

              return res.status(200).json({
                runId,
                groupId,
                machineId,
                runUrl,
                tags,
                warnings: [{
                  name: 'foo',
                  message: 'foo',
                  code: 'FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS',
                  limit: 500,
                  gracePeriodEnds: '2999-12-31',
                  orgId: 'org-id-1234',
                }],
              })
            },
          },
        }))

        it('renders preflight warning messages prior to run warnings', async function () {
          return await systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            group: 'foo',
            tag: 'nightly',
            record: true,
            parallel: true,
            snapshot: true,
            ciBuildId: 'ciBuildId123',
          })
        })
      })
    })
  })

  describe('api interaction warnings', () => {
    describe('create run warnings', () => {
      describe('grace period - over private tests limit', () => {
        const mockServer = setupStubbedServer(createRoutes({
          postRun: {
            res (req, res) {
              mockServer.setSpecs(req)

              return res.status(200).json({
                runId,
                groupId,
                machineId,
                runUrl,
                tags,
                warnings: [{
                  name: 'foo',
                  message: 'foo',
                  code: 'FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS',
                  limit: 500,
                  gracePeriodEnds: '2999-12-31',
                  orgId: 'org-id-1234',
                }],
              })
            },
          },

        }))

        it('warns when over private test results', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          })
        })
      })

      describe('grace period - over tests limit', () => {
        const mockServer = setupStubbedServer(createRoutes({
          postRun: {
            res (req, res) {
              mockServer.setSpecs(req)

              return res.status(200).json({
                runId,
                groupId,
                machineId,
                runUrl,
                tags,
                warnings: [{
                  name: 'foo',
                  message: 'foo',
                  code: 'FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS',
                  limit: 500,
                  gracePeriodEnds: '2999-12-31',
                  orgId: 'org-id-1234',
                }],
              })
            },
          },
        }))

        it('warns when over test results', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          })
        })
      })

      describe('grace period - parallel feature', () => {
        const mockServer = setupStubbedServer(createRoutes({
          postRun: {
            res (req, res) {
              mockServer.setSpecs(req)

              return res.status(200).json({
                runId,
                groupId,
                machineId,
                runUrl,
                tags,
                warnings: [{
                  name: 'foo',
                  message: 'foo',
                  code: 'FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE',
                  gracePeriodEnds: '2999-12-31',
                  orgId: 'org-id-1234',
                }],
              })
            },
          },
        }))

        it('warns when using parallel feature', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          })
        })
      })

      describe('grace period - grouping feature', () => {
        const mockServer = setupStubbedServer(createRoutes({
          postRun: {
            res (req, res) {
              mockServer.setSpecs(req)

              return res.status(200).json({
                runId,
                groupId,
                machineId,
                runUrl,
                tags,
                warnings: [{
                  name: 'foo',
                  message: 'foo',
                  code: 'PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED',
                  gracePeriodEnds: '2999-12-31',
                  orgId: 'org-id-1234',
                }],
              })
            },
          },
        }))

        it('warns when using parallel feature', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          })
        })
      })

      describe('paid plan - over private tests limit', () => {
        const mockServer = setupStubbedServer(createRoutes({
          postRun: {
            res (req, res) {
              mockServer.setSpecs(req)

              return res.status(200).json({
                runId,
                groupId,
                machineId,
                runUrl,
                tags,
                warnings: [{
                  name: 'foo',
                  message: 'foo',
                  code: 'PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS',
                  used: 700,
                  limit: 500,
                  orgId: 'org-id-1234',
                }],
              })
            },
          },
        }))

        it('warns when over private test results', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          })
        })
      })

      describe('paid plan - over tests limit', () => {
        const mockServer = setupStubbedServer(createRoutes({
          postRun: {
            res (req, res) {
              mockServer.setSpecs(req)

              return res.status(200).json({
                runId,
                groupId,
                machineId,
                runUrl,
                tags,
                warnings: [{
                  name: 'foo',
                  message: 'foo',
                  code: 'PAID_PLAN_EXCEEDS_MONTHLY_TESTS',
                  used: 700,
                  limit: 500,
                  orgId: 'org-id-1234',
                }],
              })
            },
          },
        }))

        it('warns when over test results', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          })
        })
      })

      describe('free plan - over tests limit v2', () => {
        const mockServer = setupStubbedServer(createRoutes({
          postRun: {
            res (req, res) {
              mockServer.setSpecs(req)

              return res.status(200).json({
                runId,
                groupId,
                machineId,
                runUrl,
                tags,
                warnings: [{
                  name: 'FreePlanExceedsMonthlyTests',
                  message: 'Warning from Cypress Cloud: Organization with free plan has exceeded monthly test results limit.',
                  code: 'FREE_PLAN_EXCEEDS_MONTHLY_TESTS_V2',
                  used: 700,
                  limit: 500,
                  orgId: 'org-id-1234',
                }],
              })
            },
          },
        }))

        it('warns when over test results', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          })
        })
      })

      describe('unknown warning', () => {
        const mockServer = setupStubbedServer(createRoutes({
          postRun: {
            res: (req, res) => {
              mockServer.setSpecs(req)
              res.json(postRunResponseWithWarnings)
            },
          },
        }))

        it('warns with unknown warning code', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          })
        })
      })
    })
  })
})
