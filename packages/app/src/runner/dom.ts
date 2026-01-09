import { getOffset } from './dimensions'

export const INT32_MAX = 2147483647

function getZIndex (el) {
  const value = getComputedStyle(el, null).getPropertyValue('z-index')

  if (/^(auto|0)$/.test(value)) {
    return INT32_MAX
  }

  return parseFloat(value)
}

export function getOrCreateHelperDom ({ body, className, css, studioActive = false }) {
  let containers = body.querySelectorAll(`.${className}`)

  if (containers.length > 0) {
    const shadowRoot = containers[0].shadowRoot

    return {
      container: containers[0],
      vueContainer: shadowRoot.querySelector('.vue-container'),
    }
  }

  // Create container element

  const container = document.createElement('div')

  container.classList.add(className)

  // NOTE: This is needed to prevent the container from inheriting styles from the body of the AUT
  container.style.all = 'initial'
  container.style.position = 'static'

  body.appendChild(container)

  // Create react-container element

  const shadowRoot = container.attachShadow({ mode: 'open' })

  const vueContainer = document.createElement('div')

  vueContainer.classList.add('vue-container')

  if (studioActive) {
  // make the shadow dom an overlay so that all clicks on the elements are captured by it
    Object.assign(vueContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '2147483647', // use the max z-index value to ensure the shadow dom is on top of all other elements
    })
  }

  shadowRoot.appendChild(vueContainer)

  // Prepend style element

  const style = document.createElement('style')

  style.innerHTML = css.toString()

  shadowRoot.prepend(style)

  return {
    container,
    vueContainer,
    shadowRoot,
  }
}

export function getSelectorHighlightStyles (elements) {
  const borderSize = 2

  return elements.map((el) => {
    let offset = getOffset(el)
    let targetElement = el

    if (offset.top === 0 && offset.left === 0 && el.children.length > 0) {
      // Try to find the first child with non-zero offset
      // This is needed to handle cases where the element is a wrapper that has 0 width and 0 height (for example an <astro-slot>)
      // so the highlight styles should be on the children and not the wrapper parent
      for (let i = 0; i < el.children.length; i++) {
        const childOffset = getOffset(el.children[i])

        if (childOffset.top !== 0 || childOffset.left !== 0) {
          offset = childOffset
          targetElement = el.children[i]
          break
        }
      }
    }

    return {
      position: 'absolute',
      margin: `0px`,
      padding: `0px`,
      width: `${targetElement.offsetWidth}px`,
      height: `${targetElement.offsetHeight}px`,
      top: `${offset.top - borderSize}px`,
      left: `${offset.left - borderSize}px`,
      transform: getComputedStyle(targetElement, null).transform,
      zIndex: getZIndex(targetElement),
    }
  })
}
