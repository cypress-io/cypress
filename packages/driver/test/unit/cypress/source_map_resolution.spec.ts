/**
 * @vitest-environment jsdom
 *
 * Unit tests for pragma detection and fetch URL resolution without loading real maps. These encode
 * real-world cases that used to break or be ignored: Cypress `tests?p=` URLs, odd characters in
 * paths, and choosing the last of many pragmas (vendor + app chunks).
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('source-map', () => {
  const SourceMapConsumer = Object.assign(
    vi.fn().mockImplementation(() => {
      return {
        destroy: vi.fn(),
        sources: [],
        _sources: { at: vi.fn() },
        _absoluteSources: [],
        originalPositionFor: vi.fn(),
        sourceContentFor: vi.fn(),
      }
    }),
    { initialize: vi.fn() },
  )

  return { SourceMapConsumer }
})

import sourceMapUtils from '../../../src/cypress/source_map_utils'

/**
 * Avoid a literal `//# sourceMappingURL=` sequence in source — Vite would treat it as this file’s own
 * source map pragma and try to open a bogus `.map` on disk.
 */
const lineMapping = (url: string) => `\n//${'#'} sourceMappingURL=${url}\n`

describe('source map URL extraction and resolution', () => {
  beforeEach(() => {
    sourceMapUtils.destroySourceMapConsumers()
  })

  describe('getLastSourceMappingUrl', () => {
    it('returns null when no pragma is present', () => {
      expect(sourceMapUtils.getLastSourceMappingUrl('console.log(1)')).toBeNull()
    })

    it('returns the last line-comment mapping URL (tools often emit multiple pragmas)', () => {
      const contents = `out${lineMapping('vendor.js.map')}${lineMapping('bundle.js.map')}`

      expect(sourceMapUtils.getLastSourceMappingUrl(contents)).toBe('bundle.js.map')
    })

    it('supports //@ style from the Source Map Revision 3 proposal', () => {
      const contents = `x\n//@${''} sourceMappingURL=out.js.map\n`

      expect(sourceMapUtils.getLastSourceMappingUrl(contents)).toBe('out.js.map')
    })

    it('supports block comment form used by some bundlers', () => {
      const contents = 'x\n/*# sourceMappingURL=chunk.js.map */\n'

      expect(sourceMapUtils.getLastSourceMappingUrl(contents)).toBe('chunk.js.map')
    })

    it('strips optional quotes around the URL', () => {
      expect(sourceMapUtils.getLastSourceMappingUrl(`//${'#'} sourceMappingURL="quoted.map"`)).toBe('quoted.map')
    })

    it('chooses the pragma that appears last in the file across line and block forms', () => {
      const contents = `//${'#'} sourceMappingURL=a.map
/*# sourceMappingURL=b.map */`

      expect(sourceMapUtils.getLastSourceMappingUrl(contents)).toBe('b.map')
    })
  })

  describe('resolveSourceMapFetchUrl', () => {
    // XHR in the spec iframe uses the same path+query the server exposes; origin is implicit (not repeated).
    it('resolves a relative .map next to a Cypress /tests?p= script URL (XHR uses path + query, same origin)', () => {
      const fq = 'http://localhost:1234/__/cypress/tests?p=cypress%2Fe2e%2Fspec.cy.js'
      const rel = '/__/cypress/tests?p=cypress%2Fe2e%2Fspec.cy.js'

      expect(sourceMapUtils.resolveSourceMapFetchUrl(fq, rel, 'spec.cy.js.map')).toBe(
        '/__/cypress/tests?p=cypress/e2e/spec.cy.js.map',
      )
    })

    it('resolves sibling maps in a subfolder under ?p=', () => {
      const fq = 'http://x/__/tests?p=tests%2Ffoo%2Fbar.cy.js'
      const rel = '/__/tests?p=tests%2Ffoo%2Fbar.cy.js'

      expect(sourceMapUtils.resolveSourceMapFetchUrl(fq, rel, 'bar.cy.js.map')).toBe(
        '/__/tests?p=tests/foo/bar.cy.js.map',
      )
    })

    it('escapes &, %, + in rebuilt ?p= paths like the Cypress server does', () => {
      const pEncoded = encodeURIComponent('src/dir&more/baz.cy.js')
      const fq = `http://x/__/tests?p=${pEncoded}`
      const rel = `/__/tests?p=${pEncoded}`

      expect(sourceMapUtils.resolveSourceMapFetchUrl(fq, rel, 'baz.cy.js.map')).toBe(
        '/__/tests?p=src/dir%26more/baz.cy.js.map',
      )
    })

    it('returns absolute http(s) URLs unchanged', () => {
      const fq = 'http://localhost/__/tests?p=a.js'
      const rel = '/__/tests?p=a.js'

      expect(
        sourceMapUtils.resolveSourceMapFetchUrl(fq, rel, 'https://cdn.example.com/app.js.map'),
      ).toBe('https://cdn.example.com/app.js.map')
    })

    it('uses site-root paths against the script origin', () => {
      const fq = 'http://localhost:9999/__/tests?p=a.js'
      const rel = '/__/tests?p=a.js'

      expect(sourceMapUtils.resolveSourceMapFetchUrl(fq, rel, '/assets/out.js.map')).toBe(
        'http://localhost:9999/assets/out.js.map',
      )
    })

    it('falls back to URL() resolution for non-Cypress relative URLs (unit tests, plain paths)', () => {
      const fq = 'http://localhost:3500/cypress/integration/script1.js'

      expect(sourceMapUtils.resolveSourceMapFetchUrl(fq, 'cypress/integration/script1.js', 'script1.js.map')).toBe(
        'http://localhost:3500/cypress/integration/script1.js.map',
      )
    })
  })
})
