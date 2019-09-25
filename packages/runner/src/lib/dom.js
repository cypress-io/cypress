import _ from 'lodash'

import { $ } from '@packages/driver'
import selectorPlaygroundHighlight from '../selector-playground/highlight'
// The '!' tells webpack to disable normal loaders, and keep loaders with `enforce: 'pre'` and `enforce: 'post'`
// This disables the CSSExtractWebpackPlugin and allows us to get the CSS as a raw string instead of saving it to a separate file.
import selectorPlaygroundCSS from '!../selector-playground/selector-playground.scss'

const styles = (styleString) => {
  return styleString.replace(/\s*\n\s*/g, '')
}

const resetStyles = `
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
`

function addHitBoxLayer (coords, body) {
  if (body == null) {
    body = $('body')
  }

  const height = 10
  const width = 10

  const dotHeight = 4
  const dotWidth = 4

  const top = coords.y - height / 2
  const left = coords.x - width / 2

  const dotTop = height / 2 - dotHeight / 2
  const dotLeft = width / 2 - dotWidth / 2

  const boxStyles = styles(`
    ${resetStyles}
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    width: ${width}px;
    height: ${height}px;
    background-color: red;
    border-radius: 5px;
    box-shadow: 0 0 5px #333;
    z-index: 2147483647;
  `)
  const box = $(`<div class="__cypress-highlight" style="${boxStyles}" />`)
  const wrapper = $(`<div style="${styles(resetStyles)} position: relative" />`).appendTo(box)
  const dotStyles = styles(`
    ${resetStyles}
    position: absolute;
    top: ${dotTop}px;
    left: ${dotLeft}px;
    height: ${dotHeight}px;
    width: ${dotWidth}px;
    height: ${dotHeight}px;
    background-color: pink;
    border-radius: 5px;
  `)

  $(`<div style="${dotStyles}">`).appendTo(wrapper)

  return box.appendTo(body)
}

function addElementBoxModelLayers ($el, body) {
  if (body == null) {
    body = $('body')
  }

  const dimensions = getElementDimensions($el)

  const container = $('<div class="__cypress-highlight">')

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

    // bail if the dimensions of this layer match the previous one
    // so we dont create unnecessary layers
    if (dimensionsMatchPreviousLayer(obj, container)) return

    return createLayer($el, attr, color, container, obj)
  })

  container.appendTo(body)

  container.children().each((index, el) => {
    const $el = $(el)
    const top = $el.data('top')
    const left = $el.data('left')

    // dont ask... for some reason we
    // have to run offset twice!
    _.times(2, () => {
      return $el.offset({ top, left })
    })
  })

  return container
}

function getOrCreateSelectorHelperDom ($body) {
  let $container = $body.find('.__cypress-selector-playground')

  if ($container.length) {
    const shadowRoot = $container[0].shadowRoot

    return {
      $container,
      shadowRoot,
      $reactContainer: $(shadowRoot).find('.react-container'),
    }
  }

  $container = $('<div />')
  .addClass('__cypress-selector-playground')
  .css({ position: 'static' })
  .appendTo($body)

  const shadowRoot = $container[0].attachShadow({ mode: 'open' })

  const $reactContainer = $('<div />')
  .addClass('react-container')
  .appendTo(shadowRoot)

  $('<style />', { html: selectorPlaygroundCSS.toString() }).prependTo(shadowRoot)

  return { $container, shadowRoot, $reactContainer }
}

function addOrUpdateSelectorPlaygroundHighlight ({ $el, $body, selector, showTooltip, onClick }) {
  const { $container, shadowRoot, $reactContainer } = getOrCreateSelectorHelperDom($body)

  if (!$el) {
    selectorPlaygroundHighlight.unmount($reactContainer[0])
    $reactContainer.off('click')
    $container.remove()

    return
  }

  const borderSize = 2

  const styles = $el.map((__, el) => {
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

function createLayer ($el, attr, color, container, dimensions) {
  const transform = $el.css('transform')

  const css = {
    transform,
    width: dimensions.width,
    height: dimensions.height,
    position: 'absolute',
    zIndex: getZIndex($el),
    backgroundColor: color,
    opacity: 0.6,
  }

  return $('<div>')
  .css(css)
  .attr('data-top', dimensions.top)
  .attr('data-left', dimensions.left)
  .attr('data-layer', attr)
  .prependTo(container)
}

function dimensionsMatchPreviousLayer (obj, container) {
  // since we're prepending to the container that
  // means the previous layer is actually the first child element
  const previousLayer = container.children().first()

  // bail if there is no previous layer
  if (!previousLayer.length) {
    return
  }

  return obj.width === previousLayer[0].offsetWidth &&
  obj.height === previousLayer[0].offsetHeight
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

function getElementDimensions ($el) {
  const dimensions = {
    offset: $el.offset(), // offset disregards margin but takes into account border + padding
    height: $el[0].offsetHeight, // we want to use offsetHeight here (because that always returns just the content hight) instead of .css() because .css('height') is altered based on whether box-sizing: border-box is set
    width: $el[0].offsetWidth,
    paddingTop: getPadding($el, 'top'),
    paddingRight: getPadding($el, 'right'),
    paddingBottom: getPadding($el, 'bottom'),
    paddingLeft: getPadding($el, 'left'),
    borderTop: getBorder($el, 'top'),
    borderRight: getBorder($el, 'right'),
    borderBottom: getBorder($el, 'bottom'),
    borderLeft: getBorder($el, 'left'),
    marginTop: getMargin($el, 'top'),
    marginRight: getMargin($el, 'right'),
    marginBottom: getMargin($el, 'bottom'),
    marginLeft: getMargin($el, 'left'),
  }

  // innerHeight: Get the current computed height for the first
  // element in the set of matched elements, including padding but not border.

  // outerHeight: Get the current computed height for the first
  // element in the set of matched elements, including padding, border,
  // and optionally margin. Returns a number (without 'px') representation
  // of the value or null if called on an empty set of elements.

  dimensions.heightWithPadding = $el.innerHeight()
  dimensions.heightWithBorder = $el.innerHeight() + getTotalFor(['borderTop', 'borderBottom'], dimensions)
  dimensions.heightWithMargin = $el.outerHeight(true)

  dimensions.widthWithPadding = $el.innerWidth()
  dimensions.widthWithBorder = $el.innerWidth() + getTotalFor(['borderRight', 'borderLeft'], dimensions)
  dimensions.widthWithMargin = $el.outerWidth(true)

  return dimensions
}

function getNumAttrValue (el, attr) {
  // nuke anything thats not a number or a negative symbol
  const num = _.toNumber(el.css(attr).replace(/[^0-9\.-]+/, ''))

  if (!_.isFinite(num)) {
    throw new Error('Element attr did not return a valid number')
  }

  return num
}

function getPadding (el, dir) {
  return getNumAttrValue(el, `padding-${dir}`)
}

function getBorder (el, dir) {
  return getNumAttrValue(el, `border-${dir}-width`)
}

function getMargin (el, dir) {
  return getNumAttrValue(el, `margin-${dir}`)
}

function getTotalFor (directions, dimensions) {
  return _.reduce(directions, (memo, direction) => {
    return memo + dimensions[direction]
  }, 0)
}

function getOuterSize (el) {
  return {
    width: el.outerWidth(true),
    height: el.outerHeight(true),
  }
}

function isInViewport (win, el) {
  let rect = el.getBoundingClientRect()

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= win.innerHeight &&
    rect.right <= win.innerWidth
  )
}

function scrollIntoView (win, el) {
  if (!el || isInViewport(win, el)) return

  el.scrollIntoView()
}

const sizzleRe = /sizzle/i

function getElementsForSelector ({ root, selector, method, cypressDom }) {
  let $el = null

  try {
    if (method === 'contains') {
      $el = root.find(cypressDom.getContainsSelector(selector))
      if ($el.length) {
        $el = cypressDom.getFirstDeepestElement($el)
      }
    } else {
      $el = root.find(selector)
    }
  } catch (err) {
    // if not a sizzle error, ignore it and let $el be null
    if (!sizzleRe.test(err.stack)) throw err
  }

  return $el
}

function addCssAnimationDisabler ($body) {
  $(`
    <style id="__cypress-animation-disabler">
      *, *:before, *:after {
        transition-property: none !important;
        animation: none !important;
      }
    </style>
  `).appendTo($body)
}

function removeCssAnimationDisabler ($body) {
  $body.find('#__cypress-animation-disabler').remove()
}

function addBlackoutForElement ($body, $el) {
  const dimensions = getElementDimensions($el)
  const width = dimensions.widthWithBorder
  const height = dimensions.heightWithBorder
  const top = dimensions.offset.top
  const left = dimensions.offset.left

  const style = styles(`
    ${resetStyles}
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    width: ${width}px;
    height: ${height}px;
    background-color: black;
    z-index: 2147483647;
  `)

  $(`<div class="__cypress-blackout" style="${style}">`).appendTo($body)
}

function addBlackout ($body, selector) {
  let $el

  try {
    $el = $body.find(selector)
    if (!$el.length) return
  } catch (err) {
    // if it's an invalid selector, just ignore it
    return
  }

  $el.each(function () {
    addBlackoutForElement($body, $(this))
  })
}

function removeBlackouts ($body) {
  $body.find('.__cypress-blackout').remove()
}

export default {
  addBlackout,
  removeBlackouts,
  addElementBoxModelLayers,
  addHitBoxLayer,
  addOrUpdateSelectorPlaygroundHighlight,
  addCssAnimationDisabler,
  removeCssAnimationDisabler,
  getElementsForSelector,
  getOuterSize,
  scrollIntoView,
}
