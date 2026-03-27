/**
 * @vitest-environment jsdom
 *
 * Exercises `loadAndInitializeSourceMap`: the path that fetches external JSON maps and records why a
 * consumer is missing. Vitest has no Cypress global; we stub `Cypress.config` because `to_posix` reads
 * it when recording diagnostics keyed by script URL.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

const fetchMock = vi.fn()

vi.mock('../../../src/cypress/network_utils', () => {
  return {
    default: {
      fetch: (...args: unknown[]) => {
        return fetchMock(...args)
      },
    },
  }
})

vi.mock('source-map', () => {
  const SourceMapConsumer = Object.assign(
    vi.fn().mockImplementation(() => {
      return {
        destroy: vi.fn(),
        sources: ['a.ts'],
        _sources: { at: vi.fn().mockReturnValue('a.ts') },
        _absoluteSources: ['/project/a.ts'],
        originalPositionFor: vi.fn(),
        sourceContentFor: vi.fn(),
      }
    }),
    { initialize: vi.fn() },
  )

  return { SourceMapConsumer }
})

import sourceMapUtils from '../../../src/cypress/source_map_utils'

describe('loadAndInitializeSourceMap', () => {
  beforeEach(() => {
    // Driver helpers normalize keys with toPosix(), which calls Cypress.config('platform') in the browser.
    global.Cypress = { config: vi.fn().mockReturnValue('linux') } as any
    fetchMock.mockReset()
    sourceMapUtils.destroySourceMapConsumers()
  })

  // Scenario: bundled spec ends with `//# sourceMappingURL=spec.cy.js.map` — must GET sibling map via ?p=.
  it('GETs an external map and records external diagnostic', async () => {
    fetchMock.mockResolvedValue(JSON.stringify({
      version: 3,
      file: 'out.js',
      sources: ['src/a.ts'],
      names: [],
      mappings: 'AAAA',
    }))

    const script = {
      fullyQualifiedUrl: 'http://localhost/__/tests?p=cypress%2Fe2e%2Fspec.cy.js',
      relativeUrl: '/__/tests?p=cypress%2Fe2e%2Fspec.cy.js',
    }

    // Build pragma without a literal `//#` substring so Vitest/Vite does not treat this file as carrying a map.
    const pragma = ['//', '# sourceMappingURL=spec.cy.js.map', '\n'].join('')
    const contents = `console.log(1)
${pragma}`

    await sourceMapUtils.loadAndInitializeSourceMap(window as Window, script as any, contents)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/__/tests?p=cypress/e2e/spec.cy.js.map', window)

    expect(sourceMapUtils.getSourceMapLoadDiagnostic(script.fullyQualifiedUrl)?.status).toBe('external')
    expect(sourceMapUtils.areSourceMapsAvailable()).toBe(true)
  })

  // 404, network error, or CORS on absolute map URL — previously indistinguishable from “no map at all”.
  it('records external_fetch_error when the map request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))

    const script = {
      fullyQualifiedUrl: 'http://localhost/t.js',
      relativeUrl: 't.js',
    }

    const p = ['//', '# sourceMappingURL=t.js.map', '\n'].join('')

    await sourceMapUtils.loadAndInitializeSourceMap(window as Window, script as any, p)

    expect(sourceMapUtils.getSourceMapLoadDiagnostic(script.fullyQualifiedUrl)?.status).toBe('external_fetch_error')
    expect(sourceMapUtils.areSourceMapsAvailable()).toBe(false)
  })

  // Corrupt or HTML error page returned instead of valid source map JSON.
  it('records external_parse_error when the map is not JSON', async () => {
    fetchMock.mockResolvedValue('not json')

    const script = {
      fullyQualifiedUrl: 'http://localhost/t.js',
      relativeUrl: 't.js',
    }

    const p = ['//', '# sourceMappingURL=t.js.map', '\n'].join('')

    await sourceMapUtils.loadAndInitializeSourceMap(window as Window, script as any, p)

    expect(sourceMapUtils.getSourceMapLoadDiagnostic(script.fullyQualifiedUrl)?.status).toBe('external_parse_error')
  })

  // Raw spec with no pragma — expected for hand-written JS without a preprocessor.
  it('records missing when there is no sourceMappingURL', async () => {
    const script = {
      fullyQualifiedUrl: 'http://localhost/t.js',
      relativeUrl: 't.js',
    }

    await sourceMapUtils.loadAndInitializeSourceMap(window as Window, script as any, 'console.log(1)')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(sourceMapUtils.getSourceMapLoadDiagnostic(script.fullyQualifiedUrl)?.status).toBe('missing')
  })

  // Next spec run must not reuse stale per-URL diagnostics from the previous file.
  it('clears diagnostics when destroySourceMapConsumers runs', async () => {
    fetchMock.mockResolvedValue(JSON.stringify({
      version: 3,
      sources: ['x'],
      names: [],
      mappings: '',
    }))

    const script = {
      fullyQualifiedUrl: 'http://localhost/a.js',
      relativeUrl: 'a.js',
    }

    const mapPragma = ['//', '# sourceMappingURL=a.js.map', '\n'].join('')

    await sourceMapUtils.loadAndInitializeSourceMap(window as Window, script as any, mapPragma)
    expect(sourceMapUtils.getSourceMapLoadDiagnostic(script.fullyQualifiedUrl)).toBeDefined()

    sourceMapUtils.destroySourceMapConsumers()
    expect(sourceMapUtils.getSourceMapLoadDiagnostic(script.fullyQualifiedUrl)).toBeUndefined()
  })
})
