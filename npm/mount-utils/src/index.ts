export const ROOT_SELECTOR = '[data-cy-root]'

export const getContainerEl = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(ROOT_SELECTOR)

  if (el) {
    return el
  }

  throw Error(`No element found that matches selector ${ROOT_SELECTOR}. Please add a root element with data-cy-root attribute to your "component-index.html" file so that Cypress can attach your component to the DOM.`)
}

export function setupHooks (optionalCallback?: Function) {
  // Consumed by the framework "mount" libs. A user might register their own mount in the scaffolded 'commands.js'
  // file that is imported by e2e and component support files by default. We don't want CT side effects to run when e2e
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

  // @ts-ignore
  Cypress.on('test:before:run', () => {
    optionalCallback?.()
  })
}

/**
 * Remove any style or extra link elements from the iframe placeholder
 * left from any previous test
 *
 * @deprecated Removed as of Cypress 11.0.0
 */
export function cleanupStyles () {
  throw new Error('cleanupStyles is no longer supported. See https://docs.cypress.io/guides/references/migration-guide#Component-Testing-Changes to migrate.')
}

/**
 * Additional styles to inject into the document.
 * A component might need 3rd party libraries from CDN,
 * local CSS files and custom styles.
 *
 * @deprecated Removed as of Cypress 11.0.0
 */
export type StyleOptions = unknown

/**
 * Injects custom style text or CSS file or 3rd party style resources
 * into the given document.
 *
 * @deprecated Removed as of Cypress 11.0.0
 */
export const injectStylesBeforeElement = (
  options: Partial<StyleOptions & { log: boolean }>,
  document: Document,
  el: HTMLElement | null,
): HTMLElement => {
  throw new Error('injectStylesBeforeElement is no longer supported. See https://docs.cypress.io/guides/references/migration-guide#Component-Testing-Changes to migrate.')
}
