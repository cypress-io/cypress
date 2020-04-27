const _ = require('lodash')

const $dom = require('../../dom')

const traversals = 'find filter not children eq closest first last next nextAll nextUntil parent parents parentsUntil prev prevAll prevUntil siblings'.split(' ')

module.exports = (Commands, Cypress, cy) => {
  _.each(traversals, (traversal) => {
    Commands.add(traversal, { prevSubject: 'element' }, (subject, arg1, arg2, options) => {
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
          $el = subject[traversal].call(subject, arg1, arg2)

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
