import { getOffset } from './dimensions'

export const INT32_MAX = 2147483647

export function getZIndex (el) {
  const value = getComputedStyle(el, null).getPropertyValue('z-index')

  if (/^(auto|0)$/.test(value)) {
    return INT32_MAX
  }

  return parseFloat(value)
}

export function getOrCreateHelperDom ({ body, className, css }) {
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

  container.style.position = 'static'

  body.appendChild(container)

  // Create react-container element

  const shadowRoot = container.attachShadow({ mode: 'open' })

  const vueContainer = document.createElement('div')

  vueContainer.classList.add('vue-container')

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
    const offset = getOffset(el)

    return {
      position: 'absolute',
      margin: `0px`,
      padding: `0px`,
      width: `${el.offsetWidth}px`,
      height: `${el.offsetHeight}px`,
      top: `${offset.top - borderSize}px`,
      left: `${offset.left - borderSize}px`,
      transform: getComputedStyle(el, null).transform,
      zIndex: getZIndex(el),
    }
  })
}
