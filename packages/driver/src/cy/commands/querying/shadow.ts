import _ from 'lodash'

import $dom from '../../../dom'
import $errUtils from '../../../cypress/error_utils'

export default (Commands, Cypress, cy, _state) => {
  Commands.add('shadow', { prevSubject: 'element' }, (subject, options) => {
    const userOptions = options || {}

    options = _.defaults({}, userOptions, { log: true })

    const consoleProps: Record<string, any> = {
      'Applied To': $dom.getElements(subject),
    }

    if (options.log !== false) {
      options._log = Cypress.log({
        timeout: options.timeout,
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

    const getShadowRoots = () => {
      // find all shadow roots of the subject(s), if any exist
      const $el = subject
      .map((i, node) => node.shadowRoot)
      .filter((i, node) => node !== undefined && node !== null)

      setEl($el)

      return cy.verifyUpcomingAssertions($el, options, {
        onRetry: getShadowRoots,
        onFail (err) {
          if (err.type !== 'existence') {
            return
          }

          const { message, docsUrl } = $errUtils.cypressErrByPath('shadow.no_shadow_root')

          err.message = message
          err.docsUrl = docsUrl
        },
      })
    }

    return getShadowRoots()
  })
}
