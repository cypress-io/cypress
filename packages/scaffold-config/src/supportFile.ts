import type { CodeLanguage } from '@packages/types'
import dedent from 'dedent'
import type { WizardFrontendFramework } from '.'

export function supportFileBody (fileName: 'e2e' | 'component', language: CodeLanguage['type']) {
  return dedent`
    // ***********************************************************
    // This example support/${fileName}.${language} is processed and
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

    // Alternatively you can use CommonJS syntax:
    // require('./commands')
  `
}

export function supportFileComponent (language: CodeLanguage['type'], framework: WizardFrontendFramework) {
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

    // Alternatively you can use CommonJS syntax:
    // require('./commands')
  `

  const exampleUse = dedent`
    // Example use:
    // cy.mount(${framework.mountModule === 'cypress/react' ? '<MyComponent />' : 'MyComponent'})
  `

  const NEWLINE = '\n\n'

  if (language === 'ts') {
    const registerMount = dedent`
      import { mount } from '${framework.mountModule}'
      import type { MountReturn } from '${framework.mountModule}'

      // Augment the Cypress namespace to include type definitions for
      // your custom command.
      // Alternatively, can be defined in cypress/support/component.d.ts
      // with a <reference path="./component" /> at the top of your spec.
      declare global {
        namespace Cypress {
          interface Chainable {
            mount(...): Cypress.Chainable<MountReturn>
          }
        }
      }

      Cypress.Commands.add('mount', mount)
    `

    return [supportFileTemplate, registerMount, exampleUse].join(NEWLINE)
  }

  const registerMount = dedent`
    import { mount } from '${framework.mountModule}'

    Cypress.Commands.add('mount', mount)
  `

  return [supportFileTemplate, registerMount, exampleUse].join(NEWLINE)
}
