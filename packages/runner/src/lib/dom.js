import _ from 'lodash'
import { $ } from '@packages/driver'
import getUniqueSelector from 'unique-selector'

import selectorHelperHighlight from '../selector-helper/highlight'

const resetStyles = `
  border: none !important
  margin: 0 !important
  padding: 0 !important
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

  const box = $('<div class="__cypress-highlight">', {
    style: `
      ${resetStyles}
      position: absolute
      top: ${top}px
      left: ${left}px
      width: ${width}px
      height: ${height}px
      background-color: red
      border-radius: 5px
      box-shadow: 0 0 5px #333
      z-index: 2147483647
    `,
  })
  const wrapper = $('<div>', { style: `${resetStyles} position: relative` }).appendTo(box)
  $('<div>', {
    style: `
      ${resetStyles}
      position: absolute
      top: ${dotTop}px
      left: ${dotLeft}px
      height: ${dotHeight}px
      width: ${dotWidth}px
      height: ${dotHeight}px
      background-color: pink
      border-radius: 5px
  `,
  }).appendTo(wrapper)

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

    // bail if the dimesions of this layer match the previous one
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
    _.times(2, () => $el.offset({ top, left }))
  })

  return container
}

function addOrUpdateSelectorHelperHighlight ($el, $body, selector, onClick) {
  let $container = $body.find('.__cypress-selector-helper')
  let $shadowRootContainer
  let shadowRoot
  let $reactContainer
  let $cover

  if ($container.length) {
    shadowRoot = $container.find('.__cypress-selector-helper-shadow-root-container')[0].shadowRoot
    $reactContainer = $(shadowRoot).find('.react-container')
    $cover = $container.find('.__cypress-selector-helper-cover')
  } else {
    $container = $('<div />')
    .addClass('__cypress-selector-helper')
    .css({ position: 'static' })
    .appendTo($body)

    $shadowRootContainer = $('<div />')
    .addClass('__cypress-selector-helper-shadow-root-container')
    .css({ position: 'static' })
    .appendTo($container)

    shadowRoot = $shadowRootContainer[0].attachShadow({ mode: 'open' })

    $('<link rel="stylesheet" href="/__cypress/runner/cypress_selector_helper.css" />').
    appendTo(shadowRoot)

    $reactContainer = $('<div />')
    .addClass('react-container')
    .appendTo(shadowRoot)

    $cover = $('<div />')
    .addClass('__cypress-selector-helper-cover')
    .appendTo($container)
  }

  if (!$el) {
    selectorHelperHighlight.unmount($reactContainer[0])
    $cover.off('click')
    $container.remove()
    return
  }

  const offset = $el.offset()
  const borderSize = 2

  const style = {
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

  $cover
  .css(style)
  .off('click')
  .on('click', onClick)

  selectorHelperHighlight.render($reactContainer[0], {
    selector,
    appendTo: shadowRoot,
    boundary: $body[0],
    style,
  })

  return $container
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
  if (!previousLayer.length) { return }

  return obj.width === previousLayer.width() &&
  obj.height === previousLayer.height()
}

function getDimensionsFor (dimensions, attr, dimension) {
  return dimensions[`${dimension}With${attr}`]
}

function getZIndex (el) {
  if (/^(auto|0)$/.test(el.css('zIndex'))) {
    return 2147483647
  } else {
    return _.toNumber(el.css('zIndex'))
  }
}

function getElementDimensions (el) {
  const dimensions = {
    offset: el.offset(), // offset disregards margin but takes into account border + padding
    height: el.height(), // we want to use height here (because that always returns just the content hight) instead of .css() because .css('height') is altered based on whether box-sizing: border-box is set
    width: el.width(),
    paddingTop: getPadding(el, 'top'),
    paddingRight: getPadding(el, 'right'),
    paddingBottom: getPadding(el, 'bottom'),
    paddingLeft: getPadding(el, 'left'),
    borderTop: getBorder(el, 'top'),
    borderRight: getBorder(el, 'right'),
    borderBottom: getBorder(el, 'bottom'),
    borderLeft: getBorder(el, 'left'),
    marginTop: getMargin(el, 'top'),
    marginRight: getMargin(el, 'right'),
    marginBottom: getMargin(el, 'bottom'),
    marginLeft: getMargin(el, 'left'),
  }

  // innerHeight: Get the current computed height for the first
  // element in the set of matched elements, including padding but not border.

  // outerHeight: Get the current computed height for the first
  // element in the set of matched elements, including padding, border,
  // and optionally margin. Returns a number (without 'px') representation
  // of the value or null if called on an empty set of elements.

  dimensions.heightWithPadding = el.innerHeight()
  dimensions.heightWithBorder = el.innerHeight() + getTotalFor(['borderTop', 'borderBottom'], dimensions)
  dimensions.heightWithMargin = el.outerHeight(true)

  dimensions.widthWithPadding = el.innerWidth()
  dimensions.widthWithBorder = el.innerWidth() + getTotalFor(['borderRight', 'borderLeft'], dimensions)
  dimensions.widthWithMargin = el.outerWidth(true)

  return dimensions
}

function getAttr (el, attr) {
  // nuke anything thats not a number or a negative symbol
  const num = _.toNumber(el.css(attr).replace(/[^0-9\.-]+/, ''))

  if (!_.isFinite(num)) {
    throw new Error('Element attr did not return a valid number')
  }

  return num
}

function getPadding (el, dir) {
  return getAttr(el, `padding-${dir}`)
}

function getBorder (el, dir) {
  return getAttr(el, `border-${dir}-width`)
}

function getMargin (el, dir) {
  return getAttr(el, `margin-${dir}`)
}

function getTotalFor (directions, dimensions) {
  return _.reduce(directions, (memo, direction) => memo + dimensions[direction], 0)
}

function getOuterSize (el) {
  return {
    width: el.outerWidth(true),
    height: el.outerHeight(true),
  }
}

function getBestSelector (el) {
  return getUniqueSelector(el)
}

export {
  addElementBoxModelLayers,
  addHitBoxLayer,
  addOrUpdateSelectorHelperHighlight,
  getBestSelector,
  getOuterSize,
}
