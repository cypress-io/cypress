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

  function executeQuery (query: string) {
    return Promise.resolve(execute({
      document: parse(query),
      schema: ctx.config.schema,
      contextValue: ctx,
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
