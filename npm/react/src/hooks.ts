export function setupHooks () {
  // @ts-ignore
  const isComponentSpec = () => true

  // When running component specs, we cannot allow "cy.visit"
  // because it will wipe out our preparation work, and does not make much sense
  // thus we overwrite "cy.visit" to throw an error
  Cypress.Commands.overwrite('visit', (visit, ...args: any[]) => {
    if (isComponentSpec()) {
      throw new Error(
        'cy.visit from a component spec is not allowed',
      )
    } else {
      // allow regular visit to proceed
      return visit(...args)
    }
  })

  /**
   * Remove any style or extra link elements from the iframe placeholder
   * left from any previous test
   *
   */
  function cleanupStyles () {
    if (!isComponentSpec()) {
      return
    }

    const styles = document.body.querySelectorAll('style')

    styles.forEach((styleElement) => {
      if (styleElement.parentElement) {
        styleElement.parentElement.removeChild(styleElement)
      }
    })

    const links = document.body.querySelectorAll('link[rel=stylesheet]')

    links.forEach((link) => {
      if (link.parentElement) {
        link.parentElement.removeChild(link)
      }
    })
  }

  beforeEach(() => {
    if (!isComponentSpec()) {
      return
    }

    cleanupStyles()
  })
}
