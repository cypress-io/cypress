export const ROOT_SELECTOR = '[data-cy-root]'

/**
 * Gets the root element used to mount the component.
 * @returns {HTMLElement} The root element
 * @throws {Error} If the root element is not found
 */
export const getContainerEl = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(ROOT_SELECTOR)

  if (el) {
    return el
  }

  throw Error(`No element found that matches selector ${ROOT_SELECTOR}. Please add a root element with data-cy-root attribute to your "component-index.html" file so that Cypress can attach your component to the DOM.`)
}

export function checkForRemovedStyleOptions (mountingOptions: Record<string, any>) {
  for (const key of ['cssFile', 'cssFiles', 'style', 'styles', 'stylesheet', 'stylesheets'] as const) {
    if (mountingOptions[key]) {
      Cypress.utils.throwErrByPath('mount.removed_style_mounting_options', key)
    }
  }
}

/**
 * Utility function to register CT side effects and run cleanup code during the "test:before:run" Cypress hook
 * @param optionalCallback Callback to be called before the next test runs
 */
export function setupHooks (optionalCallback?: Function) {
  // We don't want CT side effects to run when e2e
  // testing so we early return.
  // System test to verify CT side effects do not pollute e2e: system-tests/test/e2e_with_mount_import_spec.ts
  if (Cypress.testingType !== 'component') {
    return
  }

  // When running component specs, we cannot allow "cy.visit"
  // because it will wipe out our preparation work, and does not make much sense
  // thus we overwrite "cy.visit" to throw an error
  Cypress.Commands.overwrite('visit', () => {
    throw new Error(
      'cy.visit from a component spec is not allowed',
    )
  })

  Cypress.Commands.overwrite('session', () => {
    throw new Error(
      'cy.session from a component spec is not allowed',
    )
  })

  Cypress.Commands.overwrite('origin', () => {
    throw new Error(
      'cy.origin from a component spec is not allowed',
    )
  })

  // @ts-ignore
  Cypress.on('test:before:run', () => {
    optionalCallback?.()
  })
}

/**
 * Remove any style or extra link elements from the iframe placeholder
 * left from any previous test
 *
 * Removed as of Cypress 11.0.0
 * @see https://on.cypress.io/migration-11-0-0-component-testing-updates
 */
export function cleanupStyles () {
  Cypress.utils.throwErrByPath('mount.cleanup_styles')
}

/**
 * Additional styles to inject into the document.
 * A component might need 3rd party libraries from CDN,
 * local CSS files and custom styles.
 *
 * Removed as of Cypress 11.0.0.
 * @see https://on.cypress.io/migration-11-0-0-component-testing-updates
 */
export type StyleOptions = unknown

/**
 * Injects custom style text or CSS file or 3rd party style resources
 * into the given document.
 *
 * Removed as of Cypress 11.0.0.
 * @see https://on.cypress.io/migration-11-0-0-component-testing-updates
 */
export const injectStylesBeforeElement = (
  options: Partial<StyleOptions & { log: boolean }>,
  document: Document,
  el: HTMLElement | null,
) => {
  Cypress.utils.throwErrByPath('mount.inject_styles_before_element')
}
