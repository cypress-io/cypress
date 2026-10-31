import $dom from '../../../dom'

// the element cy.scrollIntoView scrolls, or the window; shared with the remote driver's agent
export const findScrollableParent = ($el, win) => {
  const $parent = $dom.getParent($el)

  // if we're at the body, we just want to pass in
  // window into jQuery scrollTo
  if ($parent.is('body,html') || $dom.isDocument($parent)) {
    return win
  }

  if ($dom.isScrollable($parent)) {
    return $parent
  }

  return findScrollableParent($parent, win)
}
