import { AutIframe } from './aut-iframe'
import { createEventManager } from '../../cypress/component/support/ctSupport'
import { getElementDimensions } from './dimensions'

describe('AutIframe._addElementBoxModelLayers', () => {
  let autIframe: AutIframe
  let mockGetComputedStyle: typeof getComputedStyle
  let getComputedStyleCallCount: number
  let mockJQuery: any

  beforeEach(() => {
    getComputedStyleCallCount = 0

    mockGetComputedStyle = window.getComputedStyle
    window.getComputedStyle = (element: Element, pseudoElement?: string | null) => {
      getComputedStyleCallCount++

      return mockGetComputedStyle.call(window, element, pseudoElement)
    }

    mockJQuery = (selector: any) => {
      if (typeof selector === 'string') {
        return {
          get: (index?: number) => {
            if (selector === 'body') {
              return index === 0 ? document.body : [document.body]
            }

            return null
          },
        }
      }

      if (selector && (selector.nodeType || selector instanceof HTMLElement || selector instanceof Element)) {
        return {
          get: (index?: number) => {
            return index === 0 ? selector : [selector]
          },
        }
      }

      return {
        get: () => null,
      }
    }

    const eventManager = createEventManager()

    autIframe = new AutIframe('Test Project', eventManager, mockJQuery)
  })

  afterEach(() => {
    window.getComputedStyle = mockGetComputedStyle
  })

  it('should not call getComputedStyle when dimensions are provided', () => {
    const testElement = document.createElement('div')

    testElement.style.width = '100px'
    testElement.style.height = '50px'
    testElement.style.padding = '10px'
    testElement.style.border = '5px solid black'
    testElement.style.margin = '15px'
    testElement.style.position = 'absolute'
    testElement.style.top = '20px'
    testElement.style.left = '30px'
    testElement.style.display = 'block'
    testElement.style.transform = 'translateX(10px)'
    testElement.style.zIndex = '100'
    document.body.appendChild(testElement)

    // Get dimensions first (this will call getComputedStyle once)
    const dimensions = getElementDimensions(testElement)

    // Verify dimensions include transform and zIndex
    expect(dimensions.transform).to.exist
    expect(dimensions.zIndex).to.exist

    // Reset the counter since getElementDimensions also calls getComputedStyle
    getComputedStyleCallCount = 0

    const $el = mockJQuery(testElement)
    const $body = mockJQuery('body')

    // When dimensions are provided, _addElementBoxModelLayers should NOT call getComputedStyle
    const container = (autIframe as any)._addElementBoxModelLayers($el, $body, dimensions)

    // Verify getComputedStyle was NOT called in _addElementBoxModelLayers
    // (it should use transform and zIndex from the provided dimensions)
    expect(getComputedStyleCallCount).to.equal(0, 'getComputedStyle should not be called when dimensions are provided')

    expect(container).to.not.be.undefined
    expect(container).to.not.be.null
    expect(container).to.be.instanceof(HTMLElement)
    expect(container.classList.contains('__cypress-highlight')).to.be.true
    expect(container.children.length).to.be.greaterThan(0, 'Should create at least one layer')

    const layers = Array.from(container.children) as HTMLElement[]

    layers.forEach((layer) => {
      expect(layer.style.position).to.equal('absolute')
      // Verify positions are stored in data attributes (not style properties)
      expect(layer.getAttribute('data-top')).to.exist
      expect(layer.getAttribute('data-left')).to.exist
      expect(parseFloat(layer.getAttribute('data-top')!)).to.be.a('number')
      expect(parseFloat(layer.getAttribute('data-left')!)).to.be.a('number')
      expect(layer.getAttribute('data-layer')).to.exist
      // Verify transform and zIndex were applied from dimensions
      // Note: getComputedStyle returns computed transform as a matrix, not the original CSS value
      // So we check that transform is set (not 'none') and matches the computed value from dimensions
      expect(layer.style.transform).to.equal(dimensions.transform)
      expect(layer.style.zIndex).to.equal('100')
    })

    document.body.removeChild(testElement)
  })

  it('should call getComputedStyle only once when dimensions are not provided', () => {
    const testElement = document.createElement('div')

    testElement.style.width = '100px'
    testElement.style.height = '50px'
    testElement.style.display = 'block'
    document.body.appendChild(testElement)

    getComputedStyleCallCount = 0

    const $el = mockJQuery(testElement)
    const $body = mockJQuery('body')

    // Call without providing dimensions (will call getElementDimensions internally)
    const container = (autIframe as any)._addElementBoxModelLayers($el, $body)

    // getElementDimensions will call getComputedStyle once and return transform/zIndex,
    // so _addElementBoxModelLayers won't need to call it again
    // We expect only 1 call total (from getElementDimensions)
    expect(getComputedStyleCallCount).to.equal(1, 'Should call getComputedStyle only once in getElementDimensions')

    expect(container).to.not.be.undefined
    expect(container).to.not.be.null
    expect(container).to.be.instanceof(HTMLElement)
    expect(container.children.length).to.be.greaterThan(0)

    document.body.removeChild(testElement)
  })
})
