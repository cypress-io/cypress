import _ from 'lodash'
import retargetEvents from 'react-shadow-dom-retarget-events'

import $Cypress from '@packages/driver'
import { getElementDimensions, setOffset } from './dimensions'
import { selectorPlaygroundHighlight } from '../selector-playground/highlight'
import { studioAssertionsMenu } from '../studio/assertions-menu'
// The '!' tells webpack to disable normal loaders, and keep loaders with `enforce: 'pre'` and `enforce: 'post'`
// This disables the CSSExtractWebpackPlugin and allows us to get the CSS as a raw string instead of saving it to a separate file.
import selectorPlaygroundCSS from '!../selector-playground/selector-playground.scss'
import studioAssertionsMenuCSS from '!../studio/assertions-menu.scss'

const $ = $Cypress.$
const INT32_MAX = 2147483647

function addElementBoxModelLayers ($el, $body) {
  $body = $body || $('body')

  const el = $el.get(0)
  const body = $body.get(0)

  const dimensions = getElementDimensions(el)

  const container = document.createElement('div')

  container.classList.add('__cypress-highlight')

  container.style.opacity = `0.7`
  container.style.position = 'absolute'
  container.style.zIndex = `${INT32_MAX}`

  const layers = {
    Content: '#9FC4E7',
    Padding: '#C1CD89',
    Border: '#FCDB9A',
    Margin: '#F9CC9D',
  }

  // create the margin / bottom / padding layers
  _.each(layers, (color, attr) => {
    let obj

    switch (attr) {
      case 'Content':
        // rearrange the contents offset so
        // its inside of our border + padding
        obj = {
          width: dimensions.width,
          height: dimensions.height,
          top: dimensions.offset.top + dimensions.borderTop + dimensions.paddingTop,
          left: dimensions.offset.left + dimensions.borderLeft + dimensions.paddingLeft,
        }

        break
      default:
        obj = {
          width: getDimensionsFor(dimensions, attr, 'width'),
          height: getDimensionsFor(dimensions, attr, 'height'),
          top: dimensions.offset.top,
          left: dimensions.offset.left,
        }
    }

    // if attr is margin then we need to additional
    // subtract what the actual marginTop + marginLeft
    // values are, since offset disregards margin completely
    if (attr === 'Margin') {
      obj.top -= dimensions.marginTop
      obj.left -= dimensions.marginLeft
    }

    if (attr === 'Padding') {
      obj.top += dimensions.borderTop
      obj.left += dimensions.borderLeft
    }

    // bail if the dimensions of this layer match the previous one
    // so we dont create unnecessary layers
    if (dimensionsMatchPreviousLayer(obj, container)) return

    createLayer($el.get(0), attr, color, container, obj)
  })

  body.appendChild(container)

  for (let i = 0; i < container.children.length; i++) {
    const el = container.children[i] // as HTMLElement
    const top = el.getAttribute('data-top')
    const left = el.getAttribute('data-left')

    setOffset(el, { top, left })
  }

  return container
}

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

function addOrUpdateSelectorPlaygroundHighlight ({ $el, $body, selector, showTooltip, onClick }) {
  const { $container, shadowRoot, $reactContainer } = getOrCreateHelperDom({
    $body,
    className: '__cypress-selector-playground',
    css: selectorPlaygroundCSS,
  })

  if (!$el) {
    selectorPlaygroundHighlight.unmount($reactContainer[0])
    $reactContainer.off('click')
    $container.remove()

    return
  }

  const styles = getSelectorHighlightStyles($el)

  if ($el.length === 1) {
    $reactContainer
    .off('click')
    .on('click', onClick)
  }

  selectorPlaygroundHighlight.render($reactContainer[0], {
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

function createLayer (el, attr, color, container, dimensions) {
  const div = document.createElement('div')

  div.style.transform = getComputedStyle(el, null).transform
  div.style.width = `${dimensions.width}px`
  div.style.height = `${dimensions.height}px`
  div.style.position = 'absolute'
  div.style.zIndex = `${getZIndex2(el)}`
  div.style.backgroundColor = color

  div.setAttribute('data-top', dimensions.top)
  div.setAttribute('data-left', dimensions.left)
  div.setAttribute('data-layer', attr)

  container.prepend(div)

  return div
}

function dimensionsMatchPreviousLayer (obj, container) {
  // since we're prepending to the container that
  // means the previous layer is actually the first child element
  const previousLayer = container.childNodes[0]

  // bail if there is no previous layer
  if (!previousLayer) {
    return
  }

  return obj.width === previousLayer.offsetWidth &&
    obj.height === previousLayer.offsetHeight
}

function getDimensionsFor (dimensions, attr, dimension) {
  return dimensions[`${dimension}With${attr}`]
}

function getZIndex (el) {
  if (/^(auto|0)$/.test(el.css('zIndex'))) {
    return 2147483647
  }

  return _.toNumber(el.css('zIndex'))
}

function getZIndex2 (el) {
  const value = getComputedStyle(el, null).getPropertyValue('z-index')

  if (/^(auto|0)$/.test(value)) {
    return INT32_MAX
  }

  return parseFloat(value)
}

export const dom = {
  addElementBoxModelLayers,
  addOrUpdateSelectorPlaygroundHighlight,
  openStudioAssertionsMenu,
  closeStudioAssertionsMenu,
}
