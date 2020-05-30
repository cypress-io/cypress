const _ = require('lodash')

const $dom = require('../../dom')
const $jquery = require('../../dom/jquery.js')

const traversals = 'find filter not children eq closest first last next nextAll nextUntil parent parents parentsUntil prev prevAll prevUntil siblings'.split(' ')

const shadowTraversals = {
  find: (cy, el, arg1, arg2) => {
    const roots = []

    for (let i = 0; i < el.length; i++) {
      roots.push(...$dom.findAllShadowRoots(el[i]))
    }
    const elementsWithShadow = el.add(roots)

    return elementsWithShadow.find(arg1, arg2)
  },
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
    let found = el.closest(arg1)
    let root = el.getRootNode()

    while (!found && root.nodeType === window.Node.DOCUMENT_FRAGMENT_NODE) {
      found = root.closest(arg1)
      root = root.getRootNode()
    }

    return found ? cy.$$(found) : null
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
          consoleProps () {
            return consoleProps
          },
        })
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
          const wrapped = $jquery.isJquery(subject) ? subject : cy.$$(subject)
          const shadowTraversal = shadowTraversals[traversal]

          if (options.ignoreShadowBoundaries && shadowTraversal) {
            $el = shadowTraversal(cy, wrapped, arg1, arg2)
          } else {
            $el = wrapped[traversal].call(wrapped, arg1, arg2)
          }

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
