import _ from 'lodash'
import $ from 'jquery'
import $document from '../document'
import $jquery from '../jquery'
import { getTagName } from './elementHelpers'
import { isWithinShadowRoot, getShadowElementFromPoint } from './shadow'
import { normalizeWhitespaces } from './utils'

/**
 * Find Parents relative to an initial element
 */
export const getParentNode = (el) => {
  // if the element has a direct parent element,
  // simply return it.
  if (el.parentElement) {
    return el.parentElement
  }

  const root = el.getRootNode()

  // if the element is inside a shadow root,
  // return the host of the root.
  if (root && isWithinShadowRoot(el)) {
    return root.host
  }

  return null
}

export const getParent = ($el: JQuery): JQuery => {
  return $(getParentNode($el[0]))
}

export const getAllParents = (el: HTMLElement, untilSelectorOrEl?: string | HTMLElement | JQuery) => {
  const collectParents = (parents, node) => {
    const parent = getParentNode(node)

    if (!parent || untilSelectorOrEl && $(parent).is(untilSelectorOrEl)) {
      return parents
    }

    return collectParents(parents.concat(parent), parent)
  }

  return collectParents([], el)
}

export const findParent = (el, condition) => {
  const collectParent = (node) => {
    const parent = getParentNode(node)

    if (!parent) return null

    const parentMatchingCondition = condition(parent, node)

    if (parentMatchingCondition) return parentMatchingCondition

    return collectParent(parent)
  }

  return collectParent(el)
}

export const getFirstParentWithTagName = ($el: JQuery, tagName: string) => {
  if (isUndefinedOrHTMLBodyDoc($el) || !tagName) {
    return null
  }

  // if this element is already the tag we want,
  // return it
  if (getTagName($el.get(0)) === tagName) {
    return $el
  }

  // walk up the tree until we find a parent with
  // the tag we want
  return findParent($el.get(0), (node) => {
    if (getTagName(node) === tagName) {
      return $jquery.wrap(node)
    }

    return null
  })
}

// Compares two elements to find the closest common parent
export const getFirstCommonAncestor = (el1, el2) => {
  // get all parents of each element
  const el1Ancestors = [el1].concat(getAllParents(el1))
  const el2Ancestors = [el2].concat(getAllParents(el2))

  let a
  let b

  // choose the largest tree of parents to
  // traverse up
  if (el1Ancestors.length > el2Ancestors.length) {
    a = el1Ancestors
    b = el2Ancestors
  } else {
    a = el2Ancestors
    b = el1Ancestors
  }

  // for each ancestor of the largest of the two
  // parent arrays, check if the other parent array
  // contains it.
  for (const ancestor of a) {
    if (b.includes(ancestor)) {
      return ancestor
    }
  }

  return el2
}

const priorityElement = 'input[type=\'submit\'], button, a, label'

export const getFirstDeepestElement = ($el: JQuery, index = 0) => {
  // iterate through all of the elements in pairs
  // and check if the next item in the array is a
  // descendent of the current. if it is continue
  // to recurse. if not, or there is no next item
  // then return the current
  const $current = $el.slice(index, index + 1)
  const $next = $el.slice(index + 1, index + 2)

  if (!$next || $current.length === 0) {
    return $current
  }

  // https://github.com/cypress-io/cypress/issues/14861
  // filter out the <script> and <style> tags
  if ($current && ['SCRIPT', 'STYLE'].includes($current.prop('tagName'))) {
    return getFirstDeepestElement($el, index + 1)
  }

  // does current contain next?
  if ($.contains($current.get(0), $next.get(0))) {
    return getFirstDeepestElement($el, index + 1)
  }

  // return the current if it already is a priority element
  if ($current.is(priorityElement)) {
    return $current
  }

  // else once we find the first deepest element then return its priority
  // parent if it has one and it exists in the elements chain
  const $parents = $jquery.wrap(getAllParents($current[0])).filter(priorityElement)
  const $priorities = $el.filter($parents)

  if ($priorities.length) {
    return $priorities.last()
  }

  return $current
}

/**
 * By XY Coordinate
 */
export const elementFromPoint = (doc, x, y): HTMLElement => {
  // first try the native elementFromPoint method
  let elFromPoint = doc.elementFromPoint(x, y)

  return getShadowElementFromPoint(elFromPoint, x, y)
}

/**
 * By DOM Hierarchy
 * Compares two elements to see what their relationship is
 */
export const isAncestor = ($el: JQuery<HTMLElement>, $maybeAncestor: JQuery<HTMLElement>) => {
  return $jquery.wrap(getAllParents($el[0])).index($maybeAncestor) >= 0
}

export const isChild = ($el: JQuery<HTMLElement>, $maybeChild: JQuery<HTMLElement>) => {
  let children = $el.children()

  if (children.length && children[0].nodeName === 'SHADOW-ROOT') {
    return isDescendent($el, $maybeChild)
  }

  return children.index($maybeChild) >= 0
}

export const isDescendent = ($el1: JQuery<HTMLElement>, $el2?: JQuery<HTMLElement>) => {
  if (!$el2) {
    return false
  }

  // if they are equal, consider them a descendent
  if ($el1.get(0) === $el2.get(0)) {
    return true
  }

  // walk up the tree until we find a parent which
  // equals the descendent, if ever
  return findParent($el2.get(0), (node) => {
    if (node === $el1.get(0)) {
      return node
    }
  }) === $el1.get(0)
}

// mostly useful when traversing up parent nodes and wanting to
// stop traversal if el is undefined or is html, body, or document
export const isUndefinedOrHTMLBodyDoc = ($el: JQuery<HTMLElement>) => {
  return !$el || !$el[0] || $el.is('body,html') || $document.isDocument($el[0])
}

/**
 * Utilities
 */
export const getElements = ($el) => {
  // bail if no $el or length
  if (!_.get($el, 'length')) {
    return
  }

  // unroll the jquery object
  const els = $jquery.unwrap($el)

  if (els.length === 1) {
    return els[0]
  }

  return els
}

/*
 * We add three custom expressions to jquery. These let us use custom
 * logic around case sensitivity, and match strings or regular expressions.
 * See https://github.com/jquery/sizzle/wiki/#-pseudo-selectors for
 * documentation on adding Sizzle selectors.
 *
 * Our use of
 *
 *   $.expr[':']['cy-contains'] = $.expr.createPseudo()
 *
 * is equivalent to
 *
 *   Sizzle.selectors.pseudos['cy-contains'] = Sizzle.selectors.createPseudo()
 *
 * in the documentation linked above. $.expr[':'] is jquery's alias for
 * Sizzle.selectors.pseudos.
 *
 * These custom expressions are used exclusively by cy.contains; see
 * `getContainsSelector` below.
 */

// Example:
// button:cy-contains("Login")
$.expr[':']['cy-contains'] = $.expr.createPseudo((text) => {
  text = JSON.parse(`"${ text }"`)

  return function (elem) {
    let testText = normalizeWhitespaces(elem)

    return testText.includes(text)
  }
})

// Example:
// .login-button:cy-contains-insensitive("login")
$.expr[':']['cy-contains-insensitive'] = $.expr.createPseudo((text) => {
  text = JSON.parse(`"${ text }"`)

  return function (elem) {
    let testText = normalizeWhitespaces(elem)

    testText = testText.toLowerCase()
    text = text.toLowerCase()

    return testText.includes(text)
  }
})

function isSubmit (elem: Element): elem is HTMLInputElement {
  return elem.tagName === 'INPUT' && (elem as HTMLInputElement).type === 'submit'
}

// Example:
// #login>li:first:cy-contains-regex('/asdf 1/i')
$.expr[':']['cy-contains-regex'] = $.expr.createPseudo((text) => {
  const lastSlash = text.lastIndexOf('/')
  const regex = new RegExp(text.slice(1, lastSlash), text.slice(lastSlash + 1))

  // taken from jquery's normal contains method
  return function (elem) {
    if (isSubmit(elem)) {
      return regex.test(elem.value)
    }

    const testText = normalizeWhitespaces(elem)

    return regex.test(testText)
  }
})

export const getContainsSelector = (text, filter = '', options: {
  matchCase?: boolean
} = {}) => {
  if (_.isRegExp(text) && options.matchCase === false && !text.flags.includes('i')) {
    text = new RegExp(text.source, text.flags + 'i') // eslint-disable-line prefer-template
  }

  const escapedText = _.isString(text) ? JSON.stringify(text).slice(1, -1) : text.toString()

  // they may have written the filter as
  // comma separated dom els, so we want to search all
  // https://github.com/cypress-io/cypress/issues/2407
  const filters = filter.trim().split(',')

  let expr = _.isRegExp(text) ? 'cy-contains-regex' : (options.matchCase ? 'cy-contains' : 'cy-contains-insensitive')

  const selectors = _.map(filters, (filter) => {
    // https://github.com/cypress-io/cypress/issues/8626
    // Sizzle cannot parse when \' is used inside [attribute~='value'] selector.
    // We need to use other type of quote characters.
    const textToFind = escapedText.includes(`\'`) ? `"${escapedText}"` : `'${escapedText}'`

    // use custom cy-contains selector that is registered above
    return `${filter}:${expr}(${textToFind}), ${filter}[type='submit'][value~=${textToFind}]`
  })

  return selectors.join()
}

export const getInputFromLabel = ($el: JQuery<HTMLElement>) => {
  if (!$el.is('label')) {
    return $([])
  }

  // If an element has a "for" attribute, then clicking on it won't
  // focus / activate any contained inputs, even if the "for" target doesn't
  // exist.
  if ($el.attr('for')) {
    // The parent().last() is the current document, which is where we want to
    // search from.
    return $(`#${$el.attr('for')}`, $el.parents().last())
  }

  // Alternately, if a label contains inputs, clicking it focuses / activates
  // the first one.
  return $('input', $el).first()
}
