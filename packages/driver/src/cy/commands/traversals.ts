import $dom from '../../dom'
import $elements from '../../dom/elements'
import { resolveShadowDomInclusion } from '../../cypress/shadow_dom_utils'
import { subjectChainToString } from '../../cypress/error_messages'

type TraversalOptions = Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Shadow>

const traversals = 'find filter not children eq closest first last next nextAll nextUntil parent parents parentsUntil prev prevAll prevUntil siblings'.split(' ')

export default (Commands, Cypress, cy) => {
  const sortedUnique = ($el) => {
    // we want _.uniq() to keep the elements with higher indexes instead of lower
    // so we reverse, uniq, then reverse again
    // so [div1, body, html, div2, body, html]
    // becomes [div1, div2, body, html] and not [div1, body, html, div2]
    const arr = Array.from($el)

    arr.reverse()
    const unique = [...new Set(arr)]

    unique.reverse()

    return cy.$$(unique)
  }

  const getEl = (traversal, includeShadowDom, subject, arg1, arg2) => {
    if (traversal === 'find' && includeShadowDom) {
      const roots = subject.map((i, el) => $dom.findAllShadowRoots(el))

      // add the roots to the existing selection
      const elementsWithShadow = subject.add((Array.from(roots) as any[]).flat())

      // query the entire set of [selection + shadow roots]
      return elementsWithShadow.find(arg1, arg2)
    }

    if (traversal === 'closest' && $dom.isWithinShadowRoot(subject[0])) {
      const nodes = Array.from(subject).reduce((nodes: any[], el: any) => {
        const getClosest = (node) => {
          const closestNode = node.closest(arg1)

          if (closestNode) return nodes.concat(closestNode)

          const root = el.getRootNode()

          if (!$elements.isShadowRoot(root)) return nodes

          return getClosest(root.host)
        }

        return getClosest(el)
      }, [])

      return sortedUnique(nodes)
    }

    if (traversal === 'parent' && $dom.isWithinShadowRoot(subject[0])) {
      const parents = subject.map((i, el) => $elements.getParentNode(el))

      return sortedUnique(parents)
    }

    if (traversal === 'parents' && $dom.isWithinShadowRoot(subject[0])) {
      let $parents = subject.map((i, el) => $elements.getAllParents(el))

      if (subject.length > 1) {
        $parents = sortedUnique($parents)
      }

      return arg1 ? $parents.filter(arg1) : $parents
    }

    if (traversal === 'parentsUntil' && $dom.isWithinShadowRoot(subject[0])) {
      let $parents = subject.map((i, el) => $elements.getAllParents(el, arg1))

      if (subject.length > 1) {
        $parents = sortedUnique($parents)
      }

      return arg2 ? $parents.filter(arg2) : $parents
    }

    return subject[traversal].call(subject, arg1, arg2)
  }

  traversals.forEach((traversal) => {
    Commands.addQuery(traversal, function traversalFn (arg1, arg2, userOptions: TraversalOptions = {}) {
      if (typeof arg1 === 'object' && arg1 !== null && typeof arg1 !== 'function') {
        userOptions = arg1
      }

      if (typeof arg2 === 'object' && arg2 !== null && typeof arg2 !== 'function') {
        userOptions = arg2
      }

      // Omit any null or undefined arguments
      const selector = [arg1, arg2].filter((a) => (a != null && typeof a !== 'function' && typeof a !== 'object')).join(', ')

      const log = Cypress.log({
        hidden: userOptions.log === false,
        message: selector,
        timeout: userOptions.timeout,
        consoleProps: () => ({}),
      })

      this.set('timeout', userOptions.timeout)

      this.set('onFail', (err) => {
        switch (err.type) {
          case 'existence': {
            const subjectChain = cy.subjectChain(this.get('chainerId'))

            err.message += ` Queried from:

              > ${subjectChainToString(subjectChain)}`

            break
          }
          default:
            break
        }
      })

      const includeShadowDom = resolveShadowDomInclusion(Cypress, userOptions.includeShadowDom)

      return (subject) => {
        Cypress.ensure.isType(subject, ['element', 'document'], traversal, cy)

        const $el = getEl(traversal, includeShadowDom, cy.$$(subject), arg1, arg2)

        // normalize the selector since jQuery won't have it
        // or completely borks it
        $el.selector = selector || traversal

        log && cy.state('current') === this && log.set({
          $el,
          consoleProps: () => {
            return {
              Selector: selector,
              'Applied To': $dom.getElements(subject),
              Yielded: $dom.getElements($el),
              Elements: $el?.length,
            }
          },
        })

        return $el
      }
    })
  })
}
