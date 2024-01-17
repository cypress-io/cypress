import $dom from '../../../dom'

export default (Commands, Cypress, cy, state) => {
  Commands.addQuery('focused', function focused (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    const log = Cypress.log({ timeout: options.timeout, hidden: options.log === false })

    this.set('timeout', options.timeout)

    return () => {
      let $el = cy.getFocused()

      cy.state('current') === this && log?.set({
        $el,
        consoleProps: () => {
          return {
            Yielded: $el?.length ? $dom.getElements($el) : '--nothing--',
            Elements: $el != null ? $el.length : 0,
          }
        },
      })

      if (!$el) {
        $el = $dom.wrap(null)
        $el.selector = 'focused'
      }

      return $el
    }
  })
}
