import { getElementDimensions } from './dimensions'

describe('dimensions utilities', () => {
  describe('getElementDimensions', () => {
    let mockGetComputedStyle: typeof getComputedStyle
    let getComputedStyleCallCount: number

    beforeEach(() => {
      getComputedStyleCallCount = 0

      mockGetComputedStyle = window.getComputedStyle
      window.getComputedStyle = (element: Element, pseudoElement?: string | null) => {
        getComputedStyleCallCount++

        return mockGetComputedStyle.call(window, element, pseudoElement)
      }
    })

    afterEach(() => {
      window.getComputedStyle = mockGetComputedStyle
    })

    it('should call getComputedStyle only once per element', () => {
      const el = document.createElement('div')

      el.style.padding = '10px'
      el.style.margin = '20px'
      el.style.border = '5px solid black'
      el.style.width = '100px'
      el.style.height = '50px'
      el.style.display = 'block'

      document.body.appendChild(el)

      const dimensions = getElementDimensions(el)

      // Verify getComputedStyle was called exactly once
      // to ensure this remains performant
      expect(getComputedStyleCallCount).to.equal(1)

      expect(dimensions.paddingTop).to.equal(10)
      expect(dimensions.paddingRight).to.equal(10)
      expect(dimensions.paddingBottom).to.equal(10)
      expect(dimensions.paddingLeft).to.equal(10)
      expect(dimensions.marginTop).to.equal(20)
      expect(dimensions.marginRight).to.equal(20)
      expect(dimensions.marginBottom).to.equal(20)
      expect(dimensions.marginLeft).to.equal(20)
      expect(dimensions.borderTop).to.equal(5)
      expect(dimensions.borderRight).to.equal(5)
      expect(dimensions.borderBottom).to.equal(5)
      expect(dimensions.borderLeft).to.equal(5)
      expect(dimensions.display).to.equal('block')

      document.body.removeChild(el)
    })
  })
})
