import { describe, expect, it, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'
import fs from 'fs-extra'
import { CypressCTWebpackPlugin } from '../src/CypressCTWebpackPlugin'
import type { CypressCTWebpackContext } from '../src/CypressCTWebpackPlugin'

vi.mock('fs-extra', () => {
  return {
    default: {
      pathExists: vi.fn(),
    },
  }
})

// Safe because the plugin only calls the promise form of pathExists
const pathExists = vi.mocked(fs.pathExists as (file: string) => Promise<boolean>)

const spec = (name: string): Cypress.Spec => {
  return {
    name,
    relative: `src/${name}`,
    absolute: `/project/src/${name}`,
  }
}

const createPlugin = (files: Cypress.Spec[], { watching }: { watching?: { invalidate: () => void } } = {}) => {
  const devServerEvents = new EventEmitter()
  let beforeCompile!: (params: object, callback: () => void) => Promise<void>
  let onCompilation!: (compilation: object) => void
  let addLoaderContext!: (loaderContext: object, module: object) => void

  const plugin = new CypressCTWebpackPlugin({
    files,
    projectRoot: '/project',
    supportFile: false,
    devServerEvents,
    webpack: Object.assign(() => {}, {
      NormalModule: {
        getCompilationHooks: () => ({ loader: { tap: (_name: string, cb: typeof addLoaderContext) => addLoaderContext = cb } }),
      },
    }),
    indexHtmlFile: 'index.html',
  })

  const utimesSync = vi.fn()

  plugin.apply({
    watching,
    hooks: {
      beforeCompile: { tapAsync: (_name: string, cb: typeof beforeCompile) => beforeCompile = cb },
      compilation: { tap: (_name: string, cb: typeof onCompilation) => onCompilation = cb },
      done: { tap: vi.fn() },
    },
  })

  // beforeCompile skips filtering until webpack has created its first compilation
  onCompilation({ inputFileSystem: { utimesSync } })

  return {
    devServerEvents,
    utimesSync,
    runBeforeCompile: () => new Promise<void>((resolve) => beforeCompile({}, resolve)),
    loadedFiles: () => {
      const loaderContext: Partial<CypressCTWebpackContext> = {}

      addLoaderContext(loaderContext, {})

      return loaderContext._cypress?.files
    },
  }
}

describe('CypressCTWebpackPlugin beforeCompile', () => {
  beforeEach(() => {
    pathExists.mockReset()
  })

  it('drops specs that no longer exist on disk', async () => {
    const kept = spec('Kept.cy.js')
    const deleted = spec('Deleted.cy.js')

    pathExists.mockImplementation(async (file) => file === kept.absolute)

    const { runBeforeCompile, loadedFiles } = createPlugin([kept, deleted])

    await runBeforeCompile()

    expect(loadedFiles()).toEqual([kept])
  })

  ;[
    { title: 'still exists', oldSpecExists: true },
    { title: 'was deleted', oldSpecExists: false },
  ].forEach(({ title, oldSpecExists }) => {
    it(`builds the newer spec list, filtered, when specs change while the file system checks are pending and the old spec ${title}`, async () => {
      const oldSpec = spec('Old.cy.js')
      const newSpec = spec('New.cy.js')
      const deletedNewSpec = spec('DeletedNew.cy.js')
      let resolveOldSpecCheck!: (exists: boolean) => void

      pathExists
      .mockImplementation(async (file) => file !== deletedNewSpec.absolute)
      .mockImplementationOnce(() => new Promise<boolean>((resolve) => resolveOldSpecCheck = resolve))

      const { devServerEvents, runBeforeCompile, loadedFiles } = createPlugin([oldSpec])
      const compile = runBeforeCompile()

      await vi.waitFor(() => expect(pathExists).toHaveBeenCalledWith(oldSpec.absolute))

      devServerEvents.emit('dev-server:specs:changed', {
        specs: [newSpec, deletedNewSpec],
        options: { neededForJustInTimeCompile: true },
      })

      resolveOldSpecCheck(oldSpecExists)
      await compile

      expect(loadedFiles()).toEqual([newSpec])
    })
  })
})

describe('CypressCTWebpackPlugin spec changes', () => {
  it('marks the watched build out of date before the spec change event returns', () => {
    const watching = { invalidate: vi.fn() }
    const { devServerEvents, utimesSync, loadedFiles } = createPlugin([spec('Old.cy.js')], { watching })

    devServerEvents.emit('dev-server:specs:changed', { specs: [spec('New.cy.js')], options: { neededForJustInTimeCompile: true } })

    expect(watching.invalidate).toHaveBeenCalledOnce()
    expect(utimesSync).not.toHaveBeenCalled()
    expect(loadedFiles()).toEqual([spec('New.cy.js')])
  })

  it('touches the component index file when webpack is not watching', () => {
    const { devServerEvents, utimesSync } = createPlugin([spec('Old.cy.js')])

    devServerEvents.emit('dev-server:specs:changed', { specs: [spec('New.cy.js')] })

    expect(utimesSync).toHaveBeenCalledWith('/project/index.html', expect.any(Date), expect.any(Date))
  })

  it('leaves the build alone when the spec list is unchanged', () => {
    const watching = { invalidate: vi.fn() }
    const { devServerEvents } = createPlugin([spec('Same.cy.js')], { watching })

    devServerEvents.emit('dev-server:specs:changed', { specs: [spec('Same.cy.js')] })

    expect(watching.invalidate).not.toHaveBeenCalled()
  })
})
