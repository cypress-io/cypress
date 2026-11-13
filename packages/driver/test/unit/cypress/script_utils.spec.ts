/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import scriptUtils from '../../../src/cypress/script_utils'
import $networkUtils from '../../../src/cypress/network_utils'
import $sourceMapUtils from '../../../src/cypress/source_map_utils'

vi.mock('../../../src/cypress/network_utils', () => {
  return {
    default: {
      fetch: vi.fn(),
    },
  }
})

vi.mock('../../../src/cypress/source_map_utils', () => {
  return {
    default: {
      extractSourceMap: vi.fn(),
      initializeSourceMapConsumer: vi.fn(),
      setSourceMapProjectRoot: vi.fn(),
    },
  }
})

describe('script utils', () => {
  const dynamicImportError = new TypeError('Failed to fetch dynamically imported module: http://localhost:5173/__cypress/src/cypress/support/component.ts')
  const crossRealmDynamicImportError = {
    message: 'Failed to fetch dynamically imported module: http://localhost:5173/__cypress/src/cypress/support/component.ts',
    name: 'TypeError',
  }
  const relativeUrl = '/__cypress/src/cypress/support/component.ts'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked($networkUtils.fetch).mockResolvedValue('')
    vi.mocked($sourceMapUtils.extractSourceMap).mockReturnValue(undefined)
    vi.mocked($sourceMapUtils.initializeSourceMapConsumer).mockResolvedValue(undefined)
  })

  const createRunOptions = (load: (() => Promise<unknown>) & { isViteDevServerImport?: boolean }, reload: () => void, isViteDevServerImport = true) => {
    load.isViteDevServerImport = isViteDevServerImport

    return {
      browser: { family: 'chromium' } as Cypress.Browser,
      scripts: [{
        absolute: '/project/cypress/support/component.ts',
        load,
        relative: '/cypress/support/component.ts',
        relativeUrl,
      }],
      specWindow: {
        location: { reload },
      } as unknown as Window,
      testingType: 'component' as Cypress.TestingType,
      projectRoot: '/project',
      specRelativePath: 'cypress/component/example.cy.ts',
      specAbsolutePath: '/project/cypress/component/example.cy.ts',
    }
  }

  it('reloads once for a Vite dynamic import failure, then surfaces a persistent failure', async () => {
    const reload = vi.fn()
    const firstLoad = vi.fn().mockRejectedValue(dynamicImportError)
    const firstRun = scriptUtils.runScripts(createRunOptions(firstLoad, reload))

    firstRun.catch(() => {})

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1))

    const firstRunState = await Promise.race([
      firstRun.then(() => 'settled', () => 'settled'),
      new Promise((resolve) => setTimeout(() => resolve('pending'), 0)),
    ])

    expect(firstRunState).toBe('pending')

    const secondLoad = vi.fn().mockRejectedValue(dynamicImportError)

    await expect(scriptUtils.runScripts(createRunOptions(secondLoad, reload))).rejects.toBe(dynamicImportError)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('allows a later transient failure after a successful reload', async () => {
    const reload = vi.fn()
    const firstRun = scriptUtils.runScripts(createRunOptions(vi.fn().mockRejectedValue(dynamicImportError), reload))

    firstRun.catch(() => {})

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    await scriptUtils.runScripts(createRunOptions(vi.fn().mockResolvedValue(undefined), reload))

    const laterRun = scriptUtils.runScripts(createRunOptions(vi.fn().mockRejectedValue(dynamicImportError), reload))

    laterRun.catch(() => {})

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(2))
    await expect(scriptUtils.runScripts(createRunOptions(vi.fn().mockRejectedValue(dynamicImportError), reload))).rejects.toBe(dynamicImportError)
  })

  it('reloads for an error-shaped Vite TypeError from another realm', async () => {
    const reload = vi.fn()
    const firstRun = scriptUtils.runScripts(createRunOptions(vi.fn().mockRejectedValue(crossRealmDynamicImportError), reload))

    firstRun.catch(() => {})

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    await scriptUtils.runScripts(createRunOptions(vi.fn().mockResolvedValue(undefined), reload))
  })

  it('does not reload for dynamic import failures from another dev server', async () => {
    const reload = vi.fn()
    const load = vi.fn().mockRejectedValue(crossRealmDynamicImportError)

    await expect(scriptUtils.runScripts(createRunOptions(load, reload, false))).rejects.toBe(crossRealmDynamicImportError)
    expect(reload).not.toHaveBeenCalled()
  })

  it('does not reload for unrelated Vite import failures', async () => {
    const reload = vi.fn()
    const importError = new TypeError('Cannot read properties of undefined')
    const load = vi.fn().mockRejectedValue(importError)

    await expect(scriptUtils.runScripts(createRunOptions(load, reload))).rejects.toBe(importError)
    expect(reload).not.toHaveBeenCalled()
  })
})
