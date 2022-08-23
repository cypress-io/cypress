import _ from 'lodash'
import retargetEvents from 'react-shadow-dom-retarget-events'

import $Cypress from '@packages/driver'
import { selectorPlaygroundHighlight } from '../selector-playground/highlight'
import { studioAssertionsMenu } from '../studio/assertions-menu'
// The '!' tells webpack to disable normal loaders, and keep loaders with `enforce: 'pre'` and `enforce: 'post'`
// This disables the CSSExtractWebpackPlugin and allows us to get the CSS as a raw string instead of saving it to a separate file.
import selectorPlaygroundCSS from '!../selector-playground/selector-playground.scss'
import studioAssertionsMenuCSS from '!../studio/assertions-menu.scss'

const $ = $Cypress.$

function getOrCreateHelperDom ({ $body, className, css }) {
  let $container = $body.find(`.${className}`)

  if ($container.length) {
    const shadowRoot = $container[0].shadowRoot

    return {
      $container,
      shadowRoot,
      $reactContainer: $(shadowRoot).find('.react-container'),
    }
  }

  $container = $('<div />')
  .addClass(className)
  .css({ position: 'static' })
  .appendTo($body)

  const shadowRoot = $container[0].attachShadow({ mode: 'open' })

  const $reactContainer = $('<div />')
  .addClass('react-container')
  .appendTo(shadowRoot)

  $('<style />', { html: css.toString() }).prependTo(shadowRoot)

  return { $container, shadowRoot, $reactContainer }
}

function getOrCreateHelperDom2 ({ body, className, css }) {
  let containers = body.querySelectorAll(`.${className}`)

  if (containers.length > 0) {
    const shadowRoot = containers[0].shadowRoot

    return {
      container: containers[0],
      shadowRoot,
      reactContainer: shadowRoot.querySelector('.react-container'),
    }
  }

  // Create container element

  const container = document.createElement('div')

  container.classList.add(className)

  container.style.position = 'static'

  body.appendChild(container)

  // Create react-container element

  const shadowRoot = container.attachShadow({ mode: 'open' })

  const reactContainer = document.createElement('div')

  reactContainer.classList.add('react-container')

  shadowRoot.appendChild(reactContainer)

  // Prepend style element

  const style = document.createElement('style')

  style.innerHTML = css.toString()

  shadowRoot.prepend(style)

  return {
    container,
    shadowRoot,
    reactContainer,
  }
}

function getSelectorHighlightStyles ($el) {
  const borderSize = 2

  return $el.map((__, el) => {
    const $el = $(el)
    const offset = $el.offset()

    return {
      position: 'absolute',
      margin: 0,
      padding: 0,
      width: $el.outerWidth(),
      height: $el.outerHeight(),
      top: offset.top - borderSize,
      left: offset.left - borderSize,
      transform: $el.css('transform'),
      zIndex: getZIndex($el),
    }
  }).get()
}

let listeners = []

function addOrUpdateSelectorPlaygroundHighlight ({ $el, $body, selector, showTooltip, onClick }) {
  const { container, shadowRoot, reactContainer } = getOrCreateHelperDom2({
    body: $body.get(0),
    className: '__cypress-selector-playground',
    css: selectorPlaygroundCSS,
  })

  const removeContainerClickListeners = () => {
    listeners.forEach((listener) => {
      reactContainer.removeEventListener('click', listener)
    })

    listeners = []
  }

  if (!$el) {
    selectorPlaygroundHighlight.unmount(reactContainer)
    removeContainerClickListeners()
    container.remove()

    return
  }

  const styles = getSelectorHighlightStyles($el)

  if ($el.length === 1) {
    removeContainerClickListeners()

    if (onClick) {
      reactContainer.addEventListener('click', onClick)
      listeners.push(onClick)
    }
  }

  selectorPlaygroundHighlight.render(reactContainer, {
    selector,
    appendTo: shadowRoot,
    showTooltip,
    styles,
  })
}

function getStudioAssertionsMenuDom ($body) {
  return getOrCreateHelperDom({
    $body,
    className: '__cypress-studio-assertions-menu',
    css: studioAssertionsMenuCSS,
  })
}

function openStudioAssertionsMenu ({ $el, $body, props }) {
  const { shadowRoot, $reactContainer } = getStudioAssertionsMenuDom($body)

  const selectorHighlightStyles = getSelectorHighlightStyles($el)[0]

  studioAssertionsMenu.render($reactContainer[0], {
    $el,
    selectorHighlightStyles,
    ...props,
  })

  retargetEvents(shadowRoot)
}

function closeStudioAssertionsMenu ($body) {
  const { $container, $reactContainer } = getStudioAssertionsMenuDom($body)

  studioAssertionsMenu.unmount($reactContainer[0])
  $container.remove()
}

function getZIndex (el) {
  if (/^(auto|0)$/.test(el.css('zIndex'))) {
    return 2147483647
  }

  return _.toNumber(el.css('zIndex'))
}

export const dom = {
  addOrUpdateSelectorPlaygroundHighlight,
  openStudioAssertionsMenu,
  closeStudioAssertionsMenu,
}
