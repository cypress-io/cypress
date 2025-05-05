import { getOrCreateHelperDom } from './dom'

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
      expect(result.container.style.all).to.equal('initial')
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
})
