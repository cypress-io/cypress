import $dom from '../../../dom'

export default (Commands, Cypress, cy, state) => {
  Commands._addQuery('focused', function focused (options: Partial<Cypress.Loggable & Cypress.Timeoutable> = {}) {
    const log = options.log !== false && Cypress.log({ timeout: options.timeout })

    return () => {
      let $el = cy.getFocused()

      log && log.set({
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
