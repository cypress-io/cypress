/* eslint-disable no-console */
const _ = require('lodash')
const Promise = require('bluebird')
const dedent = require('dedent')

const systemTests = require('../lib/system-tests').default

const {
  createRoutes,
  setupStubbedServer,
  getRequestUrls,
  getRequests,
  postRunResponse,
  postRunResponseWithWarnings,
  postRunInstanceResponse,
  encryptBody,
  postRunResponseWithProtocolDisabled,
} = require('../lib/serverStub')
const debug = require('debug')('cypress:system-tests:record_spec_api_interactions')

let { runId, groupId, machineId, runUrl, tags } = postRunResponse
const { instanceId } = postRunInstanceResponse

describe('api interaction', () => {
  context('errors', () => {
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
          reqSchema: ['createRun', 4],
          // force this to throw a schema error
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
            `PUT /instances/${instanceId}/artifacts`,
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
          config: {
            video: true,
          },
        })
        .then(() => {
          const urls = getRequestUrls()

          expect(urls).to.deep.eq([
            'POST /runs',
            `POST /runs/${runId}/instances`,
            `POST /instances/${instanceId}/tests`,
            `POST /instances/${instanceId}/results`,
            'PUT /screenshots/1.png',
            'PUT /videos/video.mp4',
            `PUT /instances/${instanceId}/artifacts`,
            `PUT /instances/${instanceId}/stdout`,
            `POST /runs/${runId}/instances`,
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
              return res.json(postRunResponseWithProtocolDisabled())
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
            'PUT /instances/e9e81b5e-cc58-4026-b2ff-8ae3161435a6/artifacts',
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

  describe('warnings', () => {
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
              res.json(postRunResponseWithProtocolDisabled(postRunResponseWithWarnings))
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
          }).then(() => {
            const urls = getRequestUrls()

            expect(urls).to.include.members([`PUT /instances/${instanceId}/artifacts`])

            const artifactReport = getRequests().find(({ url }) => url === `PUT /instances/${instanceId}/artifacts`).body

            debug(artifactReport)
          })
        })
      })
    })
  })
})
