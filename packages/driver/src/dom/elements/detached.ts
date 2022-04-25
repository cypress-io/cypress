import $window from '../window'
import $document from '../document'
import $ from 'jquery'
import $jquery from '../jquery'

export const isDetached = ($el) => {
  return !isAttached($el)
}

export const isAttached = function ($el) {
  // if we're being given window
  // then these are automatically attached
  if ($window.isWindow($el)) {
    // there is a code path when forcing focus and
    // blur on the window where this check is necessary.
    return true
  }

  const nodes: Node[] = []

  // push the set of elements to the nodes array
  // whether they are wrapped or not
  if ($jquery.isJquery($el)) {
    nodes.push(...$el.toArray())
  } else if ($el) {
    nodes.push($el)
  }

  // if there are no nodes, nothing is attached
  if (nodes.length === 0) {
    return false
  }

  // check that every node has an active window
  // and is connected to the dom
  return nodes.every((node) => {
    const doc = $document.getDocumentFromElement(node)

    if (!$document.hasActiveWindow(doc)) {
      return false
    }

    return node.isConnected
  })
}

export const isDetachedEl = (el: HTMLElement | JQuery<any>) => {
  return !isAttachedEl(el)
}

export const isAttachedEl = function (el: HTMLElement | JQuery<any>) {
  return isAttached($(el))
}
