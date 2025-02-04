import type { CodeLanguage } from '@packages/types'
import dedent from 'dedent'

export function supportFileE2E (language: CodeLanguage['type']) {
  return dedent`
    // ***********************************************************
    // This example support/e2e.${language} is processed and
    // loaded automatically before your test files.
    //
    // This is a great place to put global configuration and
    // behavior that modifies Cypress.
    //
    // You can change the location of this file or turn off
    // automatically serving support files with the
    // 'supportFile' configuration option.
    //
    // You can read more here:
    // https://on.cypress.io/configuration
    // ***********************************************************

    // Import commands.js using ES2015 syntax:
    import './commands'
  `
}

export function supportFileComponent (language: CodeLanguage['type'], mountModule: string) {
  const supportFileTemplate = dedent`
    // ***********************************************************
    // This example support/component.${language} is processed and
    // loaded automatically before your test files.
    //
    // This is a great place to put global configuration and
    // behavior that modifies Cypress.
    //
    // You can change the location of this file or turn off
    // automatically serving support files with the
    // 'supportFile' configuration option.
    //
    // You can read more here:
    // https://on.cypress.io/configuration
    // ***********************************************************

    // Import commands.js using ES2015 syntax:
    import './commands'
  `

  const exampleUse = dedent`
    // Example use:
    // cy.mount(${mountModule.includes('cypress/react') ? '<MyComponent />' : 'MyComponent'})
  `

  const NEWLINE = '\n\n'

  if (language === 'ts') {
    const registerMount = dedent`
      import { mount } from '${mountModule}'

      // Augment the Cypress namespace to include type definitions for
      // your custom command.
      // Alternatively, can be defined in cypress/support/component.d.ts
      // with a <reference path="./component" /> at the top of your spec.
      declare global {
        namespace Cypress {
          interface Chainable {
            mount: typeof mount
          }
        }
      }

      Cypress.Commands.add('mount', mount)
    `

    return [supportFileTemplate, registerMount, exampleUse].join(NEWLINE)
  }

  const registerMount = dedent`
    import { mount } from '${mountModule}'

    Cypress.Commands.add('mount', mount)
  `

  return [supportFileTemplate, registerMount, exampleUse].join(NEWLINE)
}
