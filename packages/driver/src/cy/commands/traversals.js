const _ = require('lodash')

const $dom = require('../../dom')

const traversals = 'find filter not children eq closest first last next nextAll nextUntil parent parents parentsUntil prev prevAll prevUntil siblings'.split(' ')

const optInShadowTraversals = {
  find: (cy, el, arg1, arg2) => {
    const roots = []

    // for each of the selection, find all descendent
    // elements who have a shadow root, and return those
    // roots.
    for (let i = 0; i < el.length; i++) {
      roots.push(...$dom.findAllShadowRoots(el[i]))
    }

    // add the roots to the existing selection
    const elementsWithShadow = el.add(roots)

    // query the entire set of [selection + shadow roots]
    return elementsWithShadow.find(arg1, arg2)
  },
}

const autoShadowTraversals = {
  parents: (cy, el, arg1) => {
    let parents = []

    for (let i = 0; i < el.length; i++) {
      let current = el[i]
      let parent

      while ((parent = $dom.getParent(current))) {
        parents.push(parent)
        current = parent
      }
    }

    return cy.$$(parents)
  },
  closest: (cy, el, arg1) => {
    let nodes = []

    for (let i = 0; i < el.length; i++) {
      let found = el[i].closest(arg1)
      let root = el[i].getRootNode()
      const win = $dom.getWindowByElement(el[i])

      // if we didn't already get a result, traverse
      // up the tree if we are in a shadow root and
      // repeat.
      while (!found && root instanceof win.ShadowRoot) {
        found = root.host.closest(arg1)
        root = root.getRootNode()
      }

      if (found) {
        nodes.push(found)
      }
    }

    return cy.$$(nodes)
  },
}

module.exports = (Commands, Cypress, cy) => {
  _.each(traversals, (traversal) => {
    Commands.add(traversal, { prevSubject: ['element', 'document'] }, (subject, arg1, arg2, options) => {
      if (_.isObject(arg1) && !_.isFunction(arg1)) {
        options = arg1
      }

      if (_.isObject(arg2) && !_.isFunction(arg2)) {
        options = arg2
      }

      const userOptions = options || {}

      options = _.defaults({}, userOptions, { log: true })

      const getSelector = () => {
        let args = _.chain([arg1, arg2]).reject(_.isFunction).reject(_.isObject).value()

        args = _.without(args, null, undefined)

        return args.join(', ')
      }

      const consoleProps = {
        Selector: getSelector(),
        'Applied To': $dom.getElements(subject),
      }

      if (options.log !== false) {
        options._log = Cypress.log({
          message: getSelector(),
          displayName: traversal.replace(/([A-Z])/, ' $1'),
          options: userOptions,
          consoleProps () {
            return consoleProps
          },
        })
      }

      const getEl = () => {
        const shadowDomSupportEnabled = Cypress.config('experimentalShadowDomSupport')
        const optInShadowTraversal = optInShadowTraversals[traversal]
        const autoShadowTraversal = autoShadowTraversals[traversal]

        if (shadowDomSupportEnabled && options.includeShadowDom && optInShadowTraversal) {
          // if we're told explicitly to ignore shadow boundaries,
          // use the replacement traversal function if one exists
          // so we can cross boundaries
          return optInShadowTraversal(cy, subject, arg1, arg2)
        }

        if (shadowDomSupportEnabled && autoShadowTraversal && $dom.isWithinShadowRoot(subject[0])) {
          // if we detect the element is within a shadow root and we're using
          // .closest() or .parents(), automatically cross shadow boundaries
          return autoShadowTraversal(cy, subject, arg1, arg2)
        }

        return subject[traversal].call(subject, arg1, arg2)
      }

      const setEl = ($el) => {
        if (options.log === false) {
          return
        }

        consoleProps.Yielded = $dom.getElements($el)
        consoleProps.Elements = $el?.length

        return options._log.set({ $el })
      }

      const getElements = () => {
        let $el

        try {
          $el = getEl()

          // normalize the selector since jQuery won't have it
          // or completely borks it
          $el.selector = getSelector()
        } catch (e) {
          e.onFail = () => {
            return options._log.error(e)
          }

          throw e
        }

        setEl($el)

        return cy.verifyUpcomingAssertions($el, options, {
          onRetry: getElements,
          onFail (err) {
            if (err.type === 'existence') {
              const node = $dom.stringify(subject, 'short')

              err.message += ` Queried from element: ${node}`
            }
          },
        })
      }

      return getElements()
    })
  })
}
