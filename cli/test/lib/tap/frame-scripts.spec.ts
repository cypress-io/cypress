import { afterEach, describe, expect, it, vi } from 'vitest'

import { readDom, readElementInfo } from '../../../lib/tap/aut/scripts'

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

    expect(readDom(null, 30000)).to.deep.eq({ html: '<html>hi</html>' })
  })

  it('truncates and flags the whole-document HTML past the cap', () => {
    stubDocument({ documentElement: { outerHTML: '<html>too long</html>' } })

    expect(readDom(null, 4)).to.deep.eq({ html: '<htm', truncated: true })
  })

  it('returns an empty string when there is no documentElement', () => {
    stubDocument({ documentElement: null })

    expect(readDom(null, 30000)).to.deep.eq({ html: '' })
  })

  it('returns each match in selector mode', () => {
    stubDocument({ querySelectorAll: () => [{ outerHTML: '<a>' }, { outerHTML: '<b>' }] })

    expect(readDom('.x', 100)).to.deep.eq({ matches: { count: 2, html: ['<a>', '<b>'] }, truncated: false })
  })

  it('caps across matches, keeping the partial element that overflows', () => {
    stubDocument({ querySelectorAll: () => [{ outerHTML: '<a>' }, { outerHTML: '<bbbb>' }] })

    const result = readDom('.x', 5)

    expect(result.matches).to.deep.eq({ count: 2, html: ['<a>', '<b'] })
    expect(result.truncated).to.eq(true)
  })

  it('tags an invalid selector rather than throwing', () => {
    stubDocument({ querySelectorAll: () => {
      throw new Error('bad selector')
    } })

    expect(readDom('>>bad', 100)).to.deep.eq({ invalidSelector: true })
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
