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

const createPlugin = (files: Cypress.Spec[]) => {
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

  plugin.apply({
    hooks: {
      beforeCompile: { tapAsync: (_name: string, cb: typeof beforeCompile) => beforeCompile = cb },
      compilation: { tap: (_name: string, cb: typeof onCompilation) => onCompilation = cb },
      done: { tap: vi.fn() },
    },
  })

  // beforeCompile skips filtering until webpack has created its first compilation
  onCompilation({ inputFileSystem: { utimesSync: vi.fn() } })

  return {
    devServerEvents,
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
