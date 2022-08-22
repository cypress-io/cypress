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
