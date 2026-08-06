import { afterEach, describe, expect, it, vi } from 'vitest'

import { countMatches, readDom, readElementInfo } from '../../../lib/tap/aut/scripts'

// These run in the AUT frame over CDP; here we call the real functions with the
// handful of DOM globals they touch stubbed, so the logic is tested without a
// full DOM environment.
afterEach(() => {
  vi.unstubAllGlobals()
})

const stubDocument = (doc: unknown) => vi.stubGlobal('document', doc)

describe('lib/tap/aut/scripts readDom', () => {
  it('returns the whole-document HTML when no selector is given', () => {
    stubDocument({ documentElement: { outerHTML: '<html>hi</html>' } })

    expect(readDom(null, 30000, 0)).to.deep.eq({ html: '<html>hi</html>' })
  })

  it('truncates and flags the whole-document HTML past the cap', () => {
    stubDocument({ documentElement: { outerHTML: '<html>too long</html>' } })

    expect(readDom(null, 4, 0)).to.deep.eq({ html: '<htm', truncated: true })
  })

  it('returns an empty string when there is no documentElement', () => {
    stubDocument({ documentElement: null })

    expect(readDom(null, 30000, 0)).to.deep.eq({ html: '' })
  })

  it('returns the matched element in selector mode', () => {
    stubDocument({ querySelectorAll: () => [{ outerHTML: '<a></a>' }] })

    expect(readDom('.x', 100, 0)).to.deep.eq({ found: true, html: '<a></a>' })
  })

  it('reads the match the index names, not the first', () => {
    stubDocument({ querySelectorAll: () => [{ outerHTML: '<a></a>' }, { outerHTML: '<b></b>' }, { outerHTML: '<c></c>' }] })

    expect(readDom('.x', 100, 2)).to.deep.eq({ found: true, html: '<c></c>' })
  })

  it('truncates and flags the matched element past the cap', () => {
    stubDocument({ querySelectorAll: () => [{ outerHTML: '<a>too long</a>' }] })

    expect(readDom('.x', 3, 0)).to.deep.eq({ found: true, html: '<a>', truncated: true })
  })

  it('reports found:false when the selector matches nothing', () => {
    stubDocument({ querySelectorAll: () => [] })

    expect(readDom('.missing', 100, 0)).to.deep.eq({ found: false })
  })

  it('tags an invalid selector rather than throwing', () => {
    stubDocument({ querySelectorAll: () => {
      throw new Error('bad selector')
    } })

    expect(readDom('>>bad', 100, 0)).to.deep.eq({ invalidSelector: true })
  })
})

describe('lib/tap/aut/scripts countMatches', () => {
  it('counts the matches without reading any of them', () => {
    stubDocument({ querySelectorAll: () => ({ length: 3 }) })

    expect(countMatches('.x')).to.deep.eq({ count: 3 })
  })

  it('tags an invalid selector rather than throwing', () => {
    stubDocument({ querySelectorAll: () => {
      throw new Error('bad selector')
    } })

    expect(countMatches('>>bad')).to.deep.eq({ invalidSelector: true })
  })
})

describe('lib/tap/aut/scripts readElementInfo', () => {
  const fakeElement = (overrides: Record<string, unknown> = {}) => ({
    tagName: 'INPUT',
    attributes: [{ name: 'data-testid', value: 'username' }, { name: 'name', value: 'username' }],
    getBoundingClientRect: () => ({ x: 8.4, y: 40.6, width: 200.2, height: 30.9 }),
    ...overrides,
  })

  it('reports the tag, attributes, rounded box, and every reported style verbatim', () => {
    // Zero-valued (`margin: 0px`, `opacity: 0`) and empty (`content`) styles
    // must survive — the guard used to be a truthiness check that dropped them.
    const computed: Record<string, string> = {
      display: 'block',
      color: 'rgb(0, 0, 0)',
      margin: '0px',
      opacity: '0',
      content: '',
    }

    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: (name: string) => computed[name] ?? '',
    }))

    const result = readElementInfo.call(fakeElement() as any, ['display', 'color', 'margin', 'opacity', 'content'])

    expect(result).to.deep.eq({
      tag: 'input',
      attributes: { 'data-testid': 'username', name: 'username' },
      styles: { display: 'block', color: 'rgb(0, 0, 0)', margin: '0px', opacity: '0', content: '' },
      box: { x: 8, y: 41, width: 200, height: 31 },
    })
  })
})
