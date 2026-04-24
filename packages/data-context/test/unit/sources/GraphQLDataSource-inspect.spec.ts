import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import { execute, parse } from 'graphql'
import path from 'path'
import { DataContext } from '../../../src'
import { deriveAppRoute } from '../../../graphql/schemaTypes/objectTypes/gql-InspectSnapshot'
import type { CoreDataShape } from '../../../src/data/coreDataShape'
import { createTestDataContext } from '../helper'
import { foundBrowserChrome } from '../../fixtures/browsers'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('@packages/root')

describe('deriveAppRoute', () => {
  function baseCoreData (): CoreDataShape {
    return {
      diagnostics: { error: null, warnings: [] },
      currentProject: null,
      currentTestingType: null,
      activeBrowser: null,
    } as unknown as CoreDataShape
  }

  it('returns ERROR when diagnostics.error is set (takes precedence)', () => {
    const coreData = baseCoreData()

    coreData.diagnostics.error = { id: 'x', cypressError: {} as any }
    coreData.currentProject = '/some/project'
    coreData.currentTestingType = 'e2e'
    coreData.activeBrowser = { name: 'chrome' } as any

    expect(deriveAppRoute(coreData)).toEqual('ERROR')
  })

  it('returns INTRO when no project is loaded', () => {
    expect(deriveAppRoute(baseCoreData())).toEqual('INTRO')
  })

  it('returns TESTING_TYPE_SELECTION when project is loaded but no testing type', () => {
    const coreData = baseCoreData()

    coreData.currentProject = '/some/project'

    expect(deriveAppRoute(coreData)).toEqual('TESTING_TYPE_SELECTION')
  })

  it('returns BROWSER_SELECTION when project + testing type are set but no browser', () => {
    const coreData = baseCoreData()

    coreData.currentProject = '/some/project'
    coreData.currentTestingType = 'e2e'

    expect(deriveAppRoute(coreData)).toEqual('BROWSER_SELECTION')
  })

  it('returns SPEC_LIST when project, testing type, and browser are all set', () => {
    const coreData = baseCoreData()

    coreData.currentProject = '/some/project'
    coreData.currentTestingType = 'component'
    coreData.activeBrowser = { name: 'chrome' } as any

    expect(deriveAppRoute(coreData)).toEqual('SPEC_LIST')
  })

  it('returns SPEC_RUNNING when an activeRun is in flight', () => {
    const coreData = baseCoreData()

    coreData.currentProject = '/some/project'
    coreData.currentTestingType = 'e2e'
    coreData.activeBrowser = { name: 'chrome' } as any
    coreData.activeRun = {
      specPath: '/some/project/cypress/e2e/foo.cy.ts',
      startedAt: '2026-04-22T00:00:00.000Z',
      endedAt: null,
      status: 'running',
      stats: null,
    }

    expect(deriveAppRoute(coreData)).toEqual('SPEC_RUNNING')
  })

  it('falls through to SPEC_LIST once activeRun reaches a terminal status', () => {
    const coreData = baseCoreData()

    coreData.currentProject = '/some/project'
    coreData.currentTestingType = 'e2e'
    coreData.activeBrowser = { name: 'chrome' } as any
    coreData.activeRun = {
      specPath: '/some/project/cypress/e2e/foo.cy.ts',
      startedAt: '2026-04-22T00:00:00.000Z',
      endedAt: '2026-04-22T00:00:10.000Z',
      status: 'finished',
    }

    expect(deriveAppRoute(coreData)).toEqual('SPEC_LIST')
  })
})

describe('Query.inspectSnapshot', () => {
  let ctx: DataContext

  beforeEach(() => {
    ctx = createTestDataContext('open')
  })

  afterEach(() => {
    process.chdir(path.join(__dirname, '../../../'))
    ctx.destroy()
  })

  function executeQuery (query: string, variableValues?: Record<string, any>) {
    return Promise.resolve(execute({
      document: parse(query),
      schema: ctx.config.schema,
      contextValue: ctx,
      variableValues,
    }))
  }

  it('returns process.pid', async () => {
    const result = await executeQuery(`{ inspectSnapshot { pid } }`)

    expect(result.errors).toBeUndefined()
    expect(result.data?.inspectSnapshot).toEqual({ pid: process.pid })
  })

  it('returns a non-empty cypressVersion string', async () => {
    const result = await executeQuery(`{ inspectSnapshot { cypressVersion } }`)

    expect(result.errors).toBeUndefined()
    const version = (result.data?.inspectSnapshot as any).cypressVersion

    expect(typeof version).toEqual('string')
    expect(version.length).toBeGreaterThan(0)
    expect(version).toEqual(pkg.version)
  })

  describe('projectRoot', () => {
    it('is null when no project is set', async () => {
      const result = await executeQuery(`{ inspectSnapshot { projectRoot } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).projectRoot).toBeNull()
    })

    it('echoes coreData.currentProject when set', async () => {
      ctx.update((d) => {
        d.currentProject = '/path/to/project'
      })

      const result = await executeQuery(`{ inspectSnapshot { projectRoot } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).projectRoot).toEqual('/path/to/project')
    })
  })

  describe('testingType', () => {
    it('is null when no testing type is selected', async () => {
      const result = await executeQuery(`{ inspectSnapshot { testingType } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).testingType).toBeNull()
    })

    it(`is 'e2e' when set to e2e`, async () => {
      ctx.update((d) => {
        d.currentTestingType = 'e2e'
      })

      const result = await executeQuery(`{ inspectSnapshot { testingType } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).testingType).toEqual('e2e')
    })

    it(`is 'component' when set to component`, async () => {
      ctx.update((d) => {
        d.currentTestingType = 'component'
      })

      const result = await executeQuery(`{ inspectSnapshot { testingType } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).testingType).toEqual('component')
    })
  })

  it('browserStatus returns ctx.coreData.app.browserStatus', async () => {
    ctx.update((d) => {
      d.app.browserStatus = 'open'
    })

    const result = await executeQuery(`{ inspectSnapshot { browserStatus } }`)

    expect(result.errors).toBeUndefined()
    expect((result.data?.inspectSnapshot as any).browserStatus).toEqual('open')
  })

  describe('activeBrowser', () => {
    it('returns null when no browser is selected', async () => {
      const result = await executeQuery(`{ inspectSnapshot { activeBrowser { name } } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).activeBrowser).toBeNull()
    })

    it('returns the browser object when one is selected', async () => {
      ctx.update((d) => {
        d.activeBrowser = foundBrowserChrome
      })

      const result = await executeQuery(`{ inspectSnapshot { activeBrowser { name } } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).activeBrowser).toEqual({ name: 'chrome' })
    })
  })

  describe('specCount', () => {
    it('returns 0 when ctx.project.specs is empty', async () => {
      ctx.project.setSpecs([])

      const result = await executeQuery(`{ inspectSnapshot { specCount } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).specCount).toEqual(0)
    })

    it('returns the length of ctx.project.specs when set', async () => {
      ctx.project.setSpecs([
        { absolute: '/a.cy.ts' } as any,
        { absolute: '/b.cy.ts' } as any,
        { absolute: '/c.cy.ts' } as any,
      ])

      const result = await executeQuery(`{ inspectSnapshot { specCount } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).specCount).toEqual(3)
    })
  })

  describe('activeRun', () => {
    it('returns null when no run has been launched', async () => {
      ctx.update((d) => {
        d.currentProject = '/path/to/project'
        d.currentTestingType = 'e2e'
        d.activeBrowser = foundBrowserChrome
      })

      const result = await executeQuery(`{ inspectSnapshot { activeRun { specPath status } } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).activeRun).toBeNull()
    })

    it('returns the running spec while a run is in flight', async () => {
      ctx.update((d) => {
        d.currentProject = '/path/to/project'
        d.currentTestingType = 'e2e'
        d.activeBrowser = foundBrowserChrome
        d.activeRun = {
          specPath: '/path/to/project/foo.cy.ts',
          startedAt: '2026-04-22T00:00:00.000Z',
          endedAt: null,
          status: 'running',
        }
      })

      const result = await executeQuery(`{ inspectSnapshot { activeRun { specPath status } } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).activeRun).toEqual({
        specPath: '/path/to/project/foo.cy.ts',
        status: 'running',
      })
    })

    it('surfaces the finished status once a run completes', async () => {
      ctx.update((d) => {
        d.currentProject = '/path/to/project'
        d.currentTestingType = 'e2e'
        d.activeBrowser = foundBrowserChrome
        d.activeRun = {
          specPath: '/path/to/project/foo.cy.ts',
          startedAt: '2026-04-22T00:00:00.000Z',
          endedAt: '2026-04-22T00:00:10.000Z',
          status: 'finished',
        }
      })

      const result = await executeQuery(`{ inspectSnapshot { activeRun { specPath status } } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).activeRun).toEqual({
        specPath: '/path/to/project/foo.cy.ts',
        status: 'finished',
      })
    })

    describe('tests + stats', () => {
      beforeEach(() => {
        ctx.actions.runState.recordLaunching('/path/to/project/foo.cy.ts')
      })

      it('returns an empty tests list and zeroed stats before any test has reported', async () => {
        const result = await executeQuery(`{
          inspectSnapshot {
            activeRun {
              tests { testId state }
              stats { passed failed pending skipped total }
            }
          }
        }`)

        expect(result.errors).toBeUndefined()
        expect((result.data?.inspectSnapshot as any).activeRun).toEqual({
          tests: [],
          stats: { passed: 0, failed: 0, pending: 0, skipped: 0, total: 0 },
        })
      })

      it('aggregates stats across mixed outcomes', async () => {
        ctx.actions.runState.recordTestResult({
          testId: 'r1', title: 'a', titlePath: ['suite', 'a'],
          state: 'passed', duration: 10, currentRetry: 0, error: null,
        })

        ctx.actions.runState.recordTestResult({
          testId: 'r2', title: 'b', titlePath: ['suite', 'b'],
          state: 'failed', duration: 5, currentRetry: 0, error: 'boom',
        })

        ctx.actions.runState.recordTestResult({
          testId: 'r3', title: 'c', titlePath: ['suite', 'c'],
          state: 'pending', duration: null, currentRetry: 0, error: null,
        })

        const result = await executeQuery(`{
          inspectSnapshot {
            activeRun {
              stats { passed failed pending skipped total }
            }
          }
        }`)

        expect(result.errors).toBeUndefined()
        expect((result.data?.inspectSnapshot as any).activeRun.stats).toEqual({
          passed: 1, failed: 1, pending: 1, skipped: 0, total: 3,
        })
      })

      it('dispatches a run:start envelope into recordStart', async () => {
        ctx.actions.runState.dispatchInspectEvent({
          kind: 'run:start',
          specPath: '/path/to/project/bar.cy.ts',
          timestamp: '2026-04-22T10:00:00.000Z',
          payload: {},
        })

        expect(ctx.coreData.activeRun).toMatchObject({
          specPath: '/path/to/project/bar.cy.ts',
          startedAt: '2026-04-22T10:00:00.000Z',
          status: 'running',
        })
      })

      it('dispatches a run:end envelope into recordEnd', async () => {
        ctx.actions.runState.dispatchInspectEvent({
          kind: 'run:start',
          specPath: '/path/to/project/foo.cy.ts',
          timestamp: '2026-04-22T10:00:00.000Z',
          payload: {},
        })

        ctx.actions.runState.dispatchInspectEvent({
          kind: 'run:end',
          specPath: '/path/to/project/foo.cy.ts',
          timestamp: '2026-04-22T10:00:10.000Z',
          payload: {},
        })

        expect(ctx.coreData.activeRun).toMatchObject({
          status: 'finished',
          endedAt: '2026-04-22T10:00:10.000Z',
        })
      })

      it('dispatches a test:result envelope into recordTestResult', async () => {
        ctx.actions.runState.dispatchInspectEvent({
          kind: 'test:result',
          specPath: '/path/to/project/foo.cy.ts',
          timestamp: '2026-04-22T10:00:05.000Z',
          payload: {
            testId: 'r42',
            title: 'works',
            titlePath: ['suite', 'works'],
            state: 'passed',
            duration: 7,
            currentRetry: 0,
            error: null,
          },
        })

        expect(ctx.coreData.activeRun?.tests.r42).toEqual({
          testId: 'r42',
          title: 'works',
          titlePath: ['suite', 'works'],
          state: 'passed',
          duration: 7,
          currentRetry: 0,
          error: null,
        })
      })

      it('drops envelopes with unknown or missing kind', () => {
        const before = ctx.coreData.activeRun

        ctx.actions.runState.dispatchInspectEvent({} as any)
        ctx.actions.runState.dispatchInspectEvent({ kind: 'bogus' as any, payload: {} })

        expect(ctx.coreData.activeRun).toBe(before)
      })

      it('drops test:result envelopes with non-terminal state', () => {
        ctx.actions.runState.dispatchInspectEvent({
          kind: 'test:result',
          payload: { testId: 'r1', state: 'something-else' },
        } as any)

        expect(ctx.coreData.activeRun?.tests).toEqual({})
      })

      it('retries overwrite the prior attempt so final state wins in stats', async () => {
        ctx.actions.runState.recordTestResult({
          testId: 'r1', title: 'flaky', titlePath: ['flaky'],
          state: 'failed', duration: 12, currentRetry: 0, error: 'first attempt',
        })

        ctx.actions.runState.recordTestResult({
          testId: 'r1', title: 'flaky', titlePath: ['flaky'],
          state: 'passed', duration: 18, currentRetry: 1, error: null,
        })

        const result = await executeQuery(`{
          inspectSnapshot {
            activeRun {
              tests { testId state currentRetry error }
              stats { passed failed total }
            }
          }
        }`)

        expect(result.errors).toBeUndefined()

        const run = (result.data?.inspectSnapshot as any).activeRun

        expect(run.tests).toEqual([
          { testId: 'r1', state: 'passed', currentRetry: 1, error: null },
        ])

        expect(run.stats).toEqual({ passed: 1, failed: 0, total: 1 })
      })
    })
  })

  describe('pinnedCommand', () => {
    beforeEach(() => {
      ctx.update((d) => {
        d.currentProject = '/path/to/project'
        d.currentTestingType = 'e2e'
        d.activeBrowser = foundBrowserChrome
      })

      ctx.actions.runState.recordLaunching('/path/to/project/foo.cy.ts')
    })

    it('returns null when Studio is not active on a test', async () => {
      const result = await executeQuery(`{ inspectSnapshot { pinnedCommand { logId } } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).pinnedCommand).toBeNull()
    })

    it('returns null when the runner reports nothing pinned', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestPinnedCommand = jest.fn(async () => null) as any
      ctx._apis.projectApi.requestCommandsSnapshot = jest.fn(async () => []) as any

      const result = await executeQuery(`{ inspectSnapshot { pinnedCommand { logId } } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).pinnedCommand).toBeNull()
    })

    it('returns null when the pinned logId has no matching command snapshot', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestPinnedCommand = jest.fn(async () => {
        return {
          testId: 'r1', logId: 'missing', consolePropsJson: null,
        }
      }) as any

      ctx._apis.projectApi.requestCommandsSnapshot = jest.fn(async () => []) as any

      const result = await executeQuery(`{ inspectSnapshot { pinnedCommand { logId } } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).pinnedCommand).toBeNull()
    })

    it('combines the pinned logId with its CommandLog and consoleProps dump', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestPinnedCommand = jest.fn(async () => {
        return {
          testId: 'r1',
          logId: 'l3',
          consolePropsJson: '{"Command":"get"}',
        }
      }) as any

      ctx._apis.projectApi.requestCommandsSnapshot = jest.fn(async () => {
        return [
          {
            id: 'l3', name: 'get', message: '.foo', state: 'passed', type: 'parent',
            testId: 'r1', displayName: null, number: 3,
            snapshotCount: 2, hasSnapshot: true, hasConsoleProps: true,
            timeout: 4000, numElements: 1, visible: true,
            groupLevel: 0, group: null, alias: null, aliasType: null,
            referencesAlias: null, hookId: null, error: null,
            wallClockStartedAt: '2026-04-22T00:00:00.000Z',
          },
        ]
      }) as any

      const result = await executeQuery(`{
        inspectSnapshot {
          pinnedCommand {
            testId logId consolePropsJson
            command { id name number snapshotCount }
          }
        }
      }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).pinnedCommand).toEqual({
        testId: 'r1',
        logId: 'l3',
        consolePropsJson: '{"Command":"get"}',
        command: { id: 'l3', name: 'get', number: 3, snapshotCount: 2 },
      })
    })
  })

  describe('inspectCommandInfo', () => {
    beforeEach(() => {
      ctx.update((d) => {
        d.currentProject = '/path/to/project'
        d.currentTestingType = 'e2e'
        d.activeBrowser = foundBrowserChrome
      })

      ctx.actions.runState.recordLaunching('/path/to/project/foo.cy.ts')
    })

    const commandInfoQuery = `
      query ($logIds: [String!]!) {
        inspectCommandInfo(logIds: $logIds) {
          ... on InspectCommandInfoResponse {
            items {
              consolePropsJson
              command { id name number }
            }
          }
          ... on InspectCommandInfoError {
            code
            detailMessage
          }
        }
      }
    `

    it('returns NOT_IN_STUDIO error when no Studio test is active', async () => {
      const result = await executeQuery(commandInfoQuery, { logIds: ['l1'] })

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectCommandInfo as any).code).toEqual('NOT_IN_STUDIO')
    })

    it('returns LOG_NOT_FOUND when logIds is empty', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      const result = await executeQuery(commandInfoQuery, { logIds: [] })

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectCommandInfo as any).code).toEqual('LOG_NOT_FOUND')
    })

    it('returns LOG_NOT_FOUND when a requested logId is not in the snapshot', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestCommandsSnapshot = jest.fn(async () => {
        return [{
          id: 'l1', name: 'visit', message: '/', state: 'passed', type: 'parent',
          testId: 'r1', displayName: null, number: 1,
          snapshotCount: 0, hasSnapshot: false, hasConsoleProps: false,
          timeout: null, numElements: null, visible: null,
          groupLevel: null, group: null, alias: null, aliasType: null,
          referencesAlias: null, hookId: null, error: null, wallClockStartedAt: null,
        }]
      }) as any

      const result = await executeQuery(commandInfoQuery, { logIds: ['l1', 'missing'] })

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectCommandInfo as any).code).toEqual('LOG_NOT_FOUND')
      expect((result.data?.inspectCommandInfo as any).detailMessage).toContain('missing')
    })

    it('returns TIMEOUT when the runner fails to respond', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      const cmd = {
        id: 'l1', name: 'visit', message: '/', state: 'passed', type: 'parent',
        testId: 'r1', displayName: null, number: 1,
        snapshotCount: 0, hasSnapshot: false, hasConsoleProps: false,
        timeout: null, numElements: null, visible: null,
        groupLevel: null, group: null, alias: null, aliasType: null,
        referencesAlias: null, hookId: null, error: null, wallClockStartedAt: null,
      }

      ctx._apis.projectApi.requestCommandsSnapshot = jest.fn(async () => [cmd]) as any
      ctx._apis.projectApi.requestCommandConsoleProps = jest.fn(async () => null) as any

      const result = await executeQuery(commandInfoQuery, { logIds: ['l1'] })

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectCommandInfo as any).code).toEqual('TIMEOUT')
    })

    it('zips commands with consoleProps in request order', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      const mkCmd = (id: string, number: number, name: string) => {
        return {
          id, name, message: '.', state: 'passed', type: 'parent',
          testId: 'r1', displayName: null, number,
          snapshotCount: 0, hasSnapshot: false, hasConsoleProps: true,
          timeout: null, numElements: null, visible: null,
          groupLevel: null, group: null, alias: null, aliasType: null,
          referencesAlias: null, hookId: null, error: null, wallClockStartedAt: null,
        }
      }

      ctx._apis.projectApi.requestCommandsSnapshot = jest.fn(async () => [mkCmd('l1', 1, 'visit'), mkCmd('l2', 2, 'get')]) as any
      ctx._apis.projectApi.requestCommandConsoleProps = jest.fn(async () => {
        return [
          { logId: 'l2', consolePropsJson: '{"Command":"get"}' },
          { logId: 'l1', consolePropsJson: '{"Command":"visit"}' },
        ]
      }) as any

      const result = await executeQuery(commandInfoQuery, { logIds: ['l2', 'l1'] })

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectCommandInfo as any).items).toEqual([
        { consolePropsJson: '{"Command":"get"}', command: { id: 'l2', name: 'get', number: 2 } },
        { consolePropsJson: '{"Command":"visit"}', command: { id: 'l1', name: 'visit', number: 1 } },
      ])
    })

    it('does not fire a pin request', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      const cmd = {
        id: 'l1', name: 'visit', message: '/', state: 'passed', type: 'parent',
        testId: 'r1', displayName: null, number: 1,
        snapshotCount: 0, hasSnapshot: false, hasConsoleProps: true,
        timeout: null, numElements: null, visible: null,
        groupLevel: null, group: null, alias: null, aliasType: null,
        referencesAlias: null, hookId: null, error: null, wallClockStartedAt: null,
      }

      const emitPin = jest.fn()

      ctx._apis.projectApi.emitPinCommand = emitPin as any
      ctx._apis.projectApi.requestPinnedCommand = jest.fn(async () => null) as any
      ctx._apis.projectApi.requestCommandsSnapshot = jest.fn(async () => [cmd]) as any
      ctx._apis.projectApi.requestCommandConsoleProps = jest.fn(async () => [{ logId: 'l1', consolePropsJson: null }]) as any

      await executeQuery(commandInfoQuery, { logIds: ['l1'] })

      expect(emitPin).not.toHaveBeenCalled()
    })
  })

  describe('appRoute', () => {
    it('returns INTRO when no project is set', async () => {
      const result = await executeQuery(`{ inspectSnapshot { appRoute } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).appRoute).toEqual('INTRO')
    })

    it('returns TESTING_TYPE_SELECTION when project but no testing type', async () => {
      ctx.update((d) => {
        d.currentProject = '/path/to/project'
      })

      const result = await executeQuery(`{ inspectSnapshot { appRoute } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).appRoute).toEqual('TESTING_TYPE_SELECTION')
    })

    it('returns BROWSER_SELECTION when project + testing type but no browser', async () => {
      ctx.update((d) => {
        d.currentProject = '/path/to/project'
        d.currentTestingType = 'e2e'
      })

      const result = await executeQuery(`{ inspectSnapshot { appRoute } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).appRoute).toEqual('BROWSER_SELECTION')
    })

    it('returns SPEC_LIST when project, testing type, and browser are set', async () => {
      ctx.update((d) => {
        d.currentProject = '/path/to/project'
        d.currentTestingType = 'e2e'
        d.activeBrowser = foundBrowserChrome
      })

      const result = await executeQuery(`{ inspectSnapshot { appRoute } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).appRoute).toEqual('SPEC_LIST')
    })

    it('returns ERROR when diagnostics.error is set (takes precedence)', async () => {
      ctx.update((d) => {
        d.currentProject = '/path/to/project'
        d.currentTestingType = 'e2e'
        d.activeBrowser = foundBrowserChrome
        d.diagnostics.error = { id: 'test', cypressError: {} as any }
      })

      const result = await executeQuery(`{ inspectSnapshot { appRoute } }`)

      expect(result.errors).toBeUndefined()
      expect((result.data?.inspectSnapshot as any).appRoute).toEqual('ERROR')
    })
  })
})

describe('Query.autInspect', () => {
  let ctx: DataContext

  beforeEach(() => {
    ctx = createTestDataContext('open')
  })

  afterEach(() => {
    process.chdir(path.join(__dirname, '../../../'))
    ctx.destroy()
  })

  function executeQuery (query: string, variableValues?: Record<string, unknown>) {
    return Promise.resolve(execute({
      document: parse(query),
      schema: ctx.config.schema,
      contextValue: ctx,
      variableValues,
    }))
  }

  const rootQuery = `{
    autInspect {
      __typename
      ... on AutInspectResponse { url title viewportWidth viewportHeight }
      ... on AutInspectError { code detailMessage }
    }
  }`

  const domQuery = `query ($selector: String!) {
    autInspectDom(selector: $selector) {
      __typename
      ... on AutInspectDomResponse {
        selector
        count
        matches { tag text attrs { name value } outerHTML }
      }
      ... on AutInspectError { code detailMessage }
    }
  }`

  describe('autInspect (root)', () => {
    it('returns NOT_IN_STUDIO when no test is Studio-activated', async () => {
      const result = await executeQuery(rootQuery)

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspect as any)).toEqual({
        __typename: 'AutInspectError',
        code: 'NOT_IN_STUDIO',
        detailMessage: expect.stringContaining('Studio'),
      })
    })

    it('returns TIMEOUT when the runner does not respond', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestAutInspectRoot = jest.fn(async () => null) as any

      const result = await executeQuery(rootQuery)

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspect as any)).toEqual({
        __typename: 'AutInspectError',
        code: 'TIMEOUT',
        detailMessage: expect.any(String),
      })
    })

    it('surfaces AUT_UNAVAILABLE from the runner', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestAutInspectRoot = jest.fn(async () => {
        return {
          error: 'AUT_UNAVAILABLE' as const,
          detailMessage: 'no doc',
        }
      }) as any

      const result = await executeQuery(rootQuery)

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspect as any)).toEqual({
        __typename: 'AutInspectError',
        code: 'AUT_UNAVAILABLE',
        detailMessage: 'no doc',
      })
    })

    it('returns the success shape when the runner replies with data', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestAutInspectRoot = jest.fn(async () => {
        return {
          data: { url: 'https://example.com/', title: 'Example', viewportWidth: 1000, viewportHeight: 660 },
        }
      }) as any

      const result = await executeQuery(rootQuery)

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspect as any)).toEqual({
        __typename: 'AutInspectResponse',
        url: 'https://example.com/',
        title: 'Example',
        viewportWidth: 1000,
        viewportHeight: 660,
      })
    })

    it('allows a null title (cross-origin AUT)', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestAutInspectRoot = jest.fn(async () => {
        return {
          data: { url: 'https://other.example/', title: null, viewportWidth: 1000, viewportHeight: 660 },
        }
      }) as any

      const result = await executeQuery(rootQuery)

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspect as any).title).toBeNull()
    })
  })

  describe('autInspectDom', () => {
    it('returns NOT_IN_STUDIO when no test is Studio-activated', async () => {
      const result = await executeQuery(domQuery, { selector: 'h1' })

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspectDom as any)).toEqual({
        __typename: 'AutInspectError',
        code: 'NOT_IN_STUDIO',
        detailMessage: expect.stringContaining('Studio'),
      })
    })

    it('surfaces INVALID_SELECTOR from the runner', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestAutInspectDom = jest.fn(async () => {
        return {
          error: 'INVALID_SELECTOR' as const,
          detailMessage: '\'foo[\' is not a valid selector',
        }
      }) as any

      const result = await executeQuery(domQuery, { selector: 'foo[' })

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspectDom as any)).toEqual({
        __typename: 'AutInspectError',
        code: 'INVALID_SELECTOR',
        detailMessage: '\'foo[\' is not a valid selector',
      })
    })

    it('passes the runner payload through verbatim (CLI/server apply no extra truncation)', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      const matches = [
        { tag: 'h1', text: 'Hello', attrs: [{ name: 'id', value: 'greet' }], outerHTML: '<h1 id="greet">Hello</h1>' },
        { tag: 'h1', text: null, attrs: [], outerHTML: '<h1></h1>' },
      ]

      ctx._apis.projectApi.requestAutInspectDom = jest.fn(async () => {
        return {
          data: { selector: 'h1', count: 42, matches },
        }
      }) as any

      const result = await executeQuery(domQuery, { selector: 'h1' })

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspectDom as any)).toEqual({
        __typename: 'AutInspectDomResponse',
        selector: 'h1',
        count: 42,
        matches,
      })

      expect(ctx._apis.projectApi.requestAutInspectDom).toHaveBeenCalledWith('h1')
    })

    it('returns TIMEOUT when the runner does not respond', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestAutInspectDom = jest.fn(async () => null) as any

      const result = await executeQuery(domQuery, { selector: 'h1' })

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspectDom as any).code).toEqual('TIMEOUT')
    })
  })

  describe('autInspectSnapshot', () => {
    const snapshotQuery = `{
      autInspectSnapshot {
        __typename
        ... on AutInspectSnapshotResponse {
          url title viewportWidth viewportHeight nodeCount truncated
          tree {
            role name selector
            children { role name selector children { role name selector } }
          }
        }
        ... on AutInspectError { code detailMessage }
      }
    }`

    it('returns NOT_IN_STUDIO when no test is Studio-activated', async () => {
      const result = await executeQuery(snapshotQuery)

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspectSnapshot as any).code).toEqual('NOT_IN_STUDIO')
    })

    it('returns TIMEOUT when the runner does not respond', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestAutInspectSnapshot = jest.fn(async () => null) as any

      const result = await executeQuery(snapshotQuery)

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspectSnapshot as any).code).toEqual('TIMEOUT')
    })

    it('passes the runner tree through verbatim', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      const tree = {
        role: 'document',
        name: 'Example',
        level: null,
        value: null,
        checked: null,
        disabled: null,
        selector: 'html',
        children: [
          {
            role: 'main',
            name: null,
            level: null,
            value: null,
            checked: null,
            disabled: null,
            selector: 'main',
            children: [
              {
                role: 'heading',
                name: 'Hello',
                level: 1,
                value: null,
                checked: null,
                disabled: null,
                selector: '#hero',
                children: [],
              },
            ],
          },
        ],
      }

      ctx._apis.projectApi.requestAutInspectSnapshot = jest.fn(async () => {
        return {
          data: {
            url: 'https://example.com/',
            title: 'Example',
            viewportWidth: 1000,
            viewportHeight: 660,
            nodeCount: 2,
            truncated: false,
            tree,
          },
        }
      }) as any

      const result = await executeQuery(snapshotQuery)

      expect(result.errors).toBeUndefined()
      const snapshot = result.data?.autInspectSnapshot as any

      expect(snapshot.__typename).toEqual('AutInspectSnapshotResponse')
      expect(snapshot.url).toEqual('https://example.com/')
      expect(snapshot.nodeCount).toEqual(2)
      expect(snapshot.truncated).toEqual(false)
      expect(snapshot.tree.role).toEqual('document')
      expect(snapshot.tree.children[0].role).toEqual('main')
      expect(snapshot.tree.children[0].children[0]).toEqual({
        role: 'heading',
        name: 'Hello',
        selector: '#hero',
      })
    })

    it('surfaces truncated=true from the runner', async () => {
      ctx.update((d) => {
        d.studioActiveTestId = 'r1'
      })

      ctx._apis.projectApi.requestAutInspectSnapshot = jest.fn(async () => {
        return {
          data: {
            url: 'https://example.com/',
            title: null,
            viewportWidth: 1000,
            viewportHeight: 660,
            nodeCount: 500,
            truncated: true,
            tree: { role: 'document', name: null, level: null, value: null, checked: null, disabled: null, selector: 'html', children: [] },
          },
        }
      }) as any

      const result = await executeQuery(snapshotQuery)

      expect(result.errors).toBeUndefined()
      expect((result.data?.autInspectSnapshot as any).truncated).toEqual(true)
      expect((result.data?.autInspectSnapshot as any).nodeCount).toEqual(500)
    })
  })
})
