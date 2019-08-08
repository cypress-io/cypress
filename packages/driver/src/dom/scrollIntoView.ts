export function scrollIntoView (target, options) {
  let targetIsDetached = !target.ownerDocument.documentElement.contains(target)

  if (isOptionsObject(options) && typeof options.behavior === 'function') {
    return options.behavior(targetIsDetached ? [] : _computeScrollIntoView(target, options))
  }

  if (targetIsDetached) {
    return
  }

  let computeOptions = getOptions(options)

  return defaultBehavior(_computeScrollIntoView(target, computeOptions), computeOptions.behavior)
}

function isOptionsObject (options) {
  return options === Object(options) && Object.keys(options).length !== 0
}

function defaultBehavior (actions, behavior) {
  if (behavior === void 0) {
    behavior = 'auto'
  }

  let canSmoothScroll = 'scrollBehavior' in document.body.style

  actions.forEach(function (_ref) {
    let el = _ref.el
    let top = _ref.top
    let left = _ref.left

    if (el.scroll && canSmoothScroll) {
      el.scroll({
        top,
        left,
        behavior,
      })
    } else {
      el.scrollTop = top
      el.scrollLeft = left
    }
  })
}

function getOptions (options) {
  if (options === false) {
    return {
      block: 'end',
      inline: 'nearest',
    }
  }

  if (isOptionsObject(options)) {
    return options
  }

  return {
    block: 'start',
    inline: 'nearest',
  }
}

function isElement (el) {
  return el != null && typeof el === 'object' && el.nodeType === 1
}

function canOverflow (overflow, skipOverflowHiddenElements) {
  if (skipOverflowHiddenElements && overflow === 'hidden') {
    return false
  }

  return overflow !== 'visible' && overflow !== 'clip'
}

function isScrollable (el, skipOverflowHiddenElements?) {
  let win = el.ownerDocument.defaultView

  if (el.clientHeight < el.scrollHeight || el.clientWidth < el.scrollWidth) {
    let style = win.getComputedStyle(el, null)

    return canOverflow(style.overflowY, skipOverflowHiddenElements) || canOverflow(style.overflowX, skipOverflowHiddenElements)
  }

  return false
}

function alignNearest (scrollingEdgeStart, scrollingEdgeEnd, scrollingSize, scrollingBorderStart, scrollingBorderEnd, elementEdgeStart, elementEdgeEnd, elementSize) {
  if (elementEdgeStart < scrollingEdgeStart && elementEdgeEnd > scrollingEdgeEnd || elementEdgeStart > scrollingEdgeStart && elementEdgeEnd < scrollingEdgeEnd) {
    return 0
  }

  if (elementEdgeStart <= scrollingEdgeStart && elementSize <= scrollingSize || elementEdgeEnd >= scrollingEdgeEnd && elementSize >= scrollingSize) {
    return elementEdgeStart - scrollingEdgeStart - scrollingBorderStart
  }

  if (elementEdgeEnd > scrollingEdgeEnd && elementSize < scrollingSize || elementEdgeStart < scrollingEdgeStart && elementSize > scrollingSize) {
    return elementEdgeEnd - scrollingEdgeEnd + scrollingBorderEnd
  }

  return 0
}

const _computeScrollIntoView = function (target, options) {
  let doc = target.ownerDocument
  let win = doc.defaultView

  let scrollMode = options.scrollMode
  let block = options.block
  let inline = options.inline
  let boundary = options.boundary
  let skipOverflowHiddenElements = options.skipOverflowHiddenElements
  let checkBoundary = typeof boundary === 'function' ? boundary : function (node) {
    return node !== boundary
  }

  if (!isElement(target)) {
    throw new TypeError('Invalid target')
  }

  let scrollingElement = doc.scrollingElement || doc.documentElement
  let frames = []
  let cursor = target

  while (isElement(cursor) && checkBoundary(cursor)) {
    cursor = cursor.parentNode

    if (cursor === scrollingElement) {
      frames.push(cursor)
      break
    }

    if (cursor === doc.body && isScrollable(cursor) && !isScrollable(doc.documentElement)) {
      continue
    }

    if (isScrollable(cursor, skipOverflowHiddenElements)) {
      frames.push(cursor)
    }
  }

  let viewportWidth = win.visualViewport ? win.visualViewport.width : win.innerWidth
  let viewportHeight = win.visualViewport ? win.visualViewport.height : win.innerHeight
  let viewportX = win.scrollX || win.pageXOffset
  let viewportY = win.scrollY || win.pageYOffset

  let _target$getBoundingCl = target.getBoundingClientRect()
  let targetHeight = _target$getBoundingCl.height
  let targetWidth = _target$getBoundingCl.width
  let targetTop = _target$getBoundingCl.top
  let targetRight = _target$getBoundingCl.right
  let targetBottom = _target$getBoundingCl.bottom
  let targetLeft = _target$getBoundingCl.left

  let targetBlock = block === 'start' || block === 'nearest' ? targetTop : block === 'end' ? targetBottom : targetTop + targetHeight / 2
  let targetInline = inline === 'center' ? targetLeft + targetWidth / 2 : inline === 'end' ? targetRight : targetLeft
  let computations = []

  for (let index = 0; index < frames.length; index++) {
    let frame = frames[index]

    let _frame$getBoundingCli = frame.getBoundingClientRect()
    let _height = _frame$getBoundingCli.height
    let _width = _frame$getBoundingCli.width
    let _top = _frame$getBoundingCli.top
    let right = _frame$getBoundingCli.right
    let bottom = _frame$getBoundingCli.bottom
    let _left = _frame$getBoundingCli.left

    if (scrollMode === 'if-needed' && targetTop >= 0 && targetLeft >= 0 && targetBottom <= viewportHeight && targetRight <= viewportWidth && targetTop >= _top && targetBottom <= bottom && targetLeft >= _left && targetRight <= right) {
      return computations
    }

    let frameStyle = win.getComputedStyle(frame)
    let borderLeft = parseInt(frameStyle.borderLeftWidth, 10)
    let borderTop = parseInt(frameStyle.borderTopWidth, 10)
    let borderRight = parseInt(frameStyle.borderRightWidth, 10)
    let borderBottom = parseInt(frameStyle.borderBottomWidth, 10)
    let blockScroll = 0
    let inlineScroll = 0
    let scrollbarWidth = 'offsetWidth' in frame ? frame.offsetWidth - frame.clientWidth - borderLeft - borderRight : 0
    let scrollbarHeight = 'offsetHeight' in frame ? frame.offsetHeight - frame.clientHeight - borderTop - borderBottom : 0

    if (scrollingElement === frame) {
      if (block === 'start') {
        blockScroll = targetBlock
      } else if (block === 'end') {
        blockScroll = targetBlock - viewportHeight
      } else if (block === 'nearest') {
        blockScroll = alignNearest(viewportY, viewportY + viewportHeight, viewportHeight, borderTop, borderBottom, viewportY + targetBlock, viewportY + targetBlock + targetHeight, targetHeight)
      } else {
        blockScroll = targetBlock - viewportHeight / 2
      }

      if (inline === 'start') {
        inlineScroll = targetInline
      } else if (inline === 'center') {
        inlineScroll = targetInline - viewportWidth / 2
      } else if (inline === 'end') {
        inlineScroll = targetInline - viewportWidth
      } else {
        inlineScroll = alignNearest(viewportX, viewportX + viewportWidth, viewportWidth, borderLeft, borderRight, viewportX + targetInline, viewportX + targetInline + targetWidth, targetWidth)
      }

      blockScroll = Math.max(0, blockScroll + viewportY)
      inlineScroll = Math.max(0, inlineScroll + viewportX)
    } else {
      if (block === 'start') {
        blockScroll = targetBlock - _top - borderTop
      } else if (block === 'end') {
        blockScroll = targetBlock - bottom + borderBottom + scrollbarHeight
      } else if (block === 'nearest') {
        blockScroll = alignNearest(_top, bottom, _height, borderTop, borderBottom + scrollbarHeight, targetBlock, targetBlock + targetHeight, targetHeight)
      } else {
        blockScroll = targetBlock - (_top + _height / 2) + scrollbarHeight / 2
      }

      if (inline === 'start') {
        inlineScroll = targetInline - _left - borderLeft
      } else if (inline === 'center') {
        inlineScroll = targetInline - (_left + _width / 2) + scrollbarWidth / 2
      } else if (inline === 'end') {
        inlineScroll = targetInline - right + borderRight + scrollbarWidth
      } else {
        inlineScroll = alignNearest(_left, right, _width, borderLeft, borderRight + scrollbarWidth, targetInline, targetInline + targetWidth, targetWidth)
      }

      let scrollLeft = frame.scrollLeft
      let scrollTop = frame.scrollTop

      blockScroll = Math.max(0, Math.min(scrollTop + blockScroll, frame.scrollHeight - _height + scrollbarHeight))
      inlineScroll = Math.max(0, Math.min(scrollLeft + inlineScroll, frame.scrollWidth - _width + scrollbarWidth))
      targetBlock += scrollTop - blockScroll
      targetInline += scrollLeft - inlineScroll
    }

    computations.push({
      el: frame,
      top: blockScroll,
      left: inlineScroll,
    })
  }

  return computations
}
