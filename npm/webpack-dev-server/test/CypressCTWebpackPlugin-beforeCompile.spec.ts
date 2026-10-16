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

const spec = (name: string) => {
  return {
    name,
    relative: `src/${name}`,
    absolute: `/project/src/${name}`,
  } as Cypress.Spec
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
    webpack: {
      NormalModule: {
        getCompilationHooks: () => ({ loader: { tap: (_name: string, cb: typeof addLoaderContext) => addLoaderContext = cb } }),
      },
    } as any,
    indexHtmlFile: 'index.html',
  })

  plugin.apply({
    hooks: {
      beforeCompile: { tapAsync: (_name: string, cb: typeof beforeCompile) => beforeCompile = cb },
      compilation: { tap: (_name: string, cb: typeof onCompilation) => onCompilation = cb },
      done: { tap: vi.fn() },
    },
  })

  // beforeCompile only filters once a compilation exists, as it does after webpack's first build
  onCompilation({ inputFileSystem: { utimesSync: vi.fn() } })

  return {
    devServerEvents,
    runBeforeCompile: () => new Promise<void>((resolve) => beforeCompile({}, resolve)),
    loadedFiles: () => {
      const loaderContext = {} as CypressCTWebpackContext

      addLoaderContext(loaderContext, {})

      return loaderContext._cypress.files
    },
  }
}

describe('CypressCTWebpackPlugin beforeCompile', () => {
  beforeEach(() => {
    vi.mocked(fs.pathExists).mockReset()
  })

  it('drops specs that no longer exist on disk', async () => {
    const kept = spec('Kept.cy.js')
    const deleted = spec('Deleted.cy.js')

    vi.mocked(fs.pathExists).mockImplementation((async (file: string) => file === kept.absolute) as any)

    const { runBeforeCompile, loadedFiles } = createPlugin([kept, deleted])

    await runBeforeCompile()

    expect(loadedFiles()).toEqual([kept])
  })

  ;[
    { title: 'still exists', oldSpecExists: true },
    { title: 'was deleted', oldSpecExists: false },
  ].forEach(({ title, oldSpecExists }) => {
    it(`keeps a spec list that changes while the file system checks are pending when the old spec ${title}`, async () => {
      const oldSpec = spec('Old.cy.js')
      const newSpec = spec('New.cy.js')
      let resolvePathExists!: (exists: boolean) => void

      vi.mocked(fs.pathExists).mockImplementationOnce((() => new Promise<boolean>((resolve) => resolvePathExists = resolve)) as any)

      const { devServerEvents, runBeforeCompile, loadedFiles } = createPlugin([oldSpec])
      const compile = runBeforeCompile()

      await vi.waitFor(() => expect(fs.pathExists).toHaveBeenCalledWith(oldSpec.absolute))

      devServerEvents.emit('dev-server:specs:changed', {
        specs: [newSpec],
        options: { neededForJustInTimeCompile: true },
      })

      resolvePathExists(oldSpecExists)
      await compile

      expect(loadedFiles()).toEqual([newSpec])

      vi.mocked(fs.pathExists).mockResolvedValue(true as never)

      // the recompile triggered by the spec change filters the newer list on its own pass
      await runBeforeCompile()

      expect(fs.pathExists).toHaveBeenLastCalledWith(newSpec.absolute)
      expect(loadedFiles()).toEqual([newSpec])
    })
  })
})
