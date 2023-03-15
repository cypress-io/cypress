import $dom from '../../../dom'
import $errUtils from '../../../cypress/error_utils'

type ShadowOptions = Partial<Cypress.Loggable & Cypress.Timeoutable>

export default (Commands, Cypress, cy, state) => {
  Commands.addQuery('shadow', function contains (userOptions: ShadowOptions = {}) {
    const log = userOptions.log !== false && Cypress.log({
      timeout: userOptions.timeout,
      consoleProps: () => ({}),
    })

    this.set('timeout', userOptions.timeout)
    this.set('onFail', (err) => {
      switch (err.type) {
        case 'existence': {
          const { message, docsUrl } = $errUtils.cypressErrByPath('shadow.no_shadow_root')

          err.message = message
          err.docsUrl = docsUrl
          break
        }
        default:
          break
      }
    })

    return (subject) => {
      Cypress.ensure.isType(subject, 'element', 'shadow', cy)

      // find all shadow roots of the subject(s), if any exist
      const $el = subject
      .map((i, node) => node.shadowRoot)
      .filter((i, node) => node !== undefined && node !== null)

      log && cy.state('current') === this && log.set({
        $el,
        consoleProps: () => {
          return {
            'Applied To': $dom.getElements(subject),
            Yielded: $dom.getElements($el),
            Elements: $el?.length,
          }
        },
      })

      return $el
    }
  })
}
