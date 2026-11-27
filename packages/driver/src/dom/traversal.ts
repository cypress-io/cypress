import _ from 'lodash'
import $elements from './elements'
import { findAllShadowRoots, isWithinShadowRoot } from './elements/shadow'

// wraps elements in the jQuery of the document they belong to
type Wrap = (elements) => JQuery<any>

export const TRAVERSALS = 'find filter not children eq closest first last next nextAll nextUntil parent parents parentsUntil prev prevAll prevUntil siblings'.split(' ')

const sortedUnique = ($$: Wrap, $el) => {
  // we want _.uniq() to keep the elements with higher indexes instead of lower
  // so we reverse, uniq, then reverse again
  // so [div1, body, html, div2, body, html]
  // becomes [div1, div2, body, html] and not [div1, body, html, div2]
  return $$(_($el).reverse().uniq().reverse().value())
}

export const traverse = ($$: Wrap, traversal: string, includeShadowDom: boolean, subject, arg1?, arg2?) => {
  if (traversal === 'find' && includeShadowDom) {
    const roots = subject.map((i, el) => findAllShadowRoots(el))

    // add the roots to the existing selection
    const elementsWithShadow = subject.add(_.flatten(roots))

    // query the entire set of [selection + shadow roots]
    return elementsWithShadow.find(arg1, arg2)
  }

  if (traversal === 'closest' && isWithinShadowRoot(subject[0])) {
    const nodes = _.reduce(subject, (nodes, el) => {
      const getClosest = (node) => {
        const closestNode = node.closest(arg1)

        if (closestNode) {
          nodes.push(closestNode)

          return nodes
        }

        const root = el.getRootNode()

        if (!$elements.isShadowRoot(root)) return nodes

        return getClosest(root.host)
      }

      return getClosest(el)
    }, [] as Element[])

    return sortedUnique($$, nodes)
  }

  if (traversal === 'parent' && isWithinShadowRoot(subject[0])) {
    const parents = subject.map((i, el) => $elements.getParentNode(el))

    return sortedUnique($$, parents)
  }

  if (traversal === 'parents' && isWithinShadowRoot(subject[0])) {
    let $parents = subject.map((i, el) => $elements.getAllParents(el))

    if (subject.length > 1) {
      $parents = sortedUnique($$, $parents)
    }

    return arg1 ? $parents.filter(arg1) : $parents
  }

  if (traversal === 'parentsUntil' && isWithinShadowRoot(subject[0])) {
    let $parents = subject.map((i, el) => $elements.getAllParents(el, arg1))

    if (subject.length > 1) {
      $parents = sortedUnique($$, $parents)
    }

    return arg2 ? $parents.filter(arg2) : $parents
  }

  return subject[traversal].call(subject, arg1, arg2)
}
