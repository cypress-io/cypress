/**
 * @vitest-environment jsdom
 */
import $ from 'jquery'
import { describe, it, expect, beforeEach } from 'vitest'
import { create } from '../../../src/cy/snapshots_css'

const addStyle = (css: string, attrs: Record<string, string> = {}) => {
  const style = document.createElement('style')

  Object.entries(attrs).forEach(([name, value]) => style.setAttribute(name, value))
  style.textContent = css
  document.head.append(style)
}

const getHeadStyles = () => {
  return create($, (key: string) => key === 'document' ? document : undefined).getStyleIds().headStyleIds
}

describe('src/cy/snapshots_css', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  describe('media filtering', () => {
    it.each([
      ['screen'],
      ['all'],
      ['only screen and (min-width: 400px)'],
      ['print, screen'],
      // https://github.com/cypress-io/cypress/issues/34982
      ['(min-width: 735px)'],
      ['not print'],
      [''],
    ])('keeps a stylesheet with media %j', (media) => {
      addStyle('p { color: blue; }', { media })

      expect(getHeadStyles()).toHaveLength(1)
    })

    it('keeps a stylesheet without media', () => {
      addStyle('p { color: blue; }')

      expect(getHeadStyles()).toHaveLength(1)
    })

    it.each([
      ['print'],
      ['speech'],
      ['print and (orientation: landscape)'],
    ])('drops a stylesheet with media %j', (media) => {
      addStyle('p { color: blue; }', { media })

      expect(getHeadStyles()).toHaveLength(0)
    })
  })

  describe('url() paths', () => {
    it('makes every quoted url absolute to the document', () => {
      addStyle(`.a { background: url('img/a.png'); } .b { background: url("/img/b.png"); }`)

      const [css] = getHeadStyles()

      expect(css).toContain(`url('${new URL('img/a.png', document.baseURI).href}')`)
      expect(css).toContain(`url('${new URL('/img/b.png', document.baseURI).href}')`)
      expect(css).not.toContain(`url('img/a.png')`)
    })
  })
})
