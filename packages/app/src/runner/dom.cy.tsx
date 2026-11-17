import { getOrCreateHelperDom, getSelectorHighlightStyles, INT32_MAX } from './dom'

describe('dom utilities', () => {
  describe('getOrCreateHelperDom', () => {
    let body: HTMLBodyElement
    const className = 'test-helper'
    const css = 'test-css'

    beforeEach(() => {
      // Create a fresh body element for each test
      body = document.createElement('body')
      document.body = body
    })

    afterEach(() => {
      // Clean up after each test
      const containers = body.querySelectorAll(`.${className}`)

      containers.forEach((container) => container.remove())
    })

    it('should create new helper DOM elements when none exist', () => {
      const result = getOrCreateHelperDom({ body, className, css })

      // Verify container was created
      expect(result.container).to.exist
      expect(result.container.classList.contains(className)).to.be.true
      // NOTE: Chrome 148+ expands `all: initial` into longhand declarations
      // and no longer reflects the shorthand via `style.all` or `cssText`, so
      // we assert a representative longhand was reset to `initial` instead.
      expect(result.container.style.color).to.equal('initial')
      expect(result.container.style.position).to.equal('static')

      // Verify shadow root was created
      expect(result.shadowRoot).to.exist
      expect(result.shadowRoot!.mode).to.equal('open')

      // Verify vue container was created
      expect(result.vueContainer).to.exist
      expect(result.vueContainer.classList.contains('vue-container')).to.be.true

      // Verify style was added
      const style = result.shadowRoot!.querySelector('style')

      expect(style).to.exist
      expect(style!.innerHTML).to.equal(css)
    })

    it('should return existing helper DOM elements when they exist', () => {
      // First call to create elements
      const firstResult = getOrCreateHelperDom({ body, className, css })

      // Second call to get existing elements
      const secondResult = getOrCreateHelperDom({ body, className, css })

      // Verify we got the same elements back
      expect(secondResult.container).to.equal(firstResult.container)
      expect(secondResult.vueContainer).to.equal(firstResult.vueContainer)
    })
  })

  describe('getSelectorHighlightStyles', () => {
    const zIndexOf = (zIndex: string) => {
      const el = document.createElement('div')

      el.style.position = 'relative'
      el.style.zIndex = zIndex
      document.body.appendChild(el)

      const [styles] = getSelectorHighlightStyles([el])

      document.body.removeChild(el)

      return styles.zIndex
    }

    it('uses INT32_MAX as the zIndex for auto and 0', () => {
      expect(zIndexOf('auto')).to.equal(INT32_MAX)
      expect(zIndexOf('0')).to.equal(INT32_MAX)
    })

    it('uses the computed zIndex for other values', () => {
      expect(zIndexOf('10')).to.equal(10)
      expect(zIndexOf('100')).to.equal(100)
      expect(zIndexOf('-1')).to.equal(-1)
    })
  })
})
