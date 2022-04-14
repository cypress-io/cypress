import { supportFileComponent } from '../../src/supportFile'
import { WIZARD_FRAMEWORKS, WizardFrontendFramework } from '../../src/frameworks'
import dedent from 'dedent'
import { expect } from 'chai'

function findByMountingModule (mountModule: WizardFrontendFramework['mountModule']) {
  return WIZARD_FRAMEWORKS.find((x) => x.mountModule === mountModule)!
}

describe('supportFileComponent', () => {
  it('handles cypress/react and JS (example with JSX)', () => {
    const actual = supportFileComponent('js', findByMountingModule('cypress/react'))

    expect(actual).to.eq(dedent`
    // ***********************************************************
    // This example support/component.js is processed and
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

    import { mount } from 'cypress/react'

    Cypress.Commands.add('mount', mount)

    // Example use:
    // cy.mount(<MyComponent />)
    `)
  })

  it('handles cypress/react and TS (example with JSX)', () => {
    const actual = supportFileComponent('ts', findByMountingModule('cypress/react'))

    expect(actual).to.eq(dedent`
    // ***********************************************************
    // This example support/component.ts is processed and
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

    import { mount } from 'cypress/react'
    import type { MountReturn } from 'cypress/react'

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

    // Example use:
    // cy.mount(<MyComponent />)
    `)
  })

  it('handles cypress/vue and JS (example no JSX)', () => {
    const actual = supportFileComponent('js', findByMountingModule('cypress/vue'))

    expect(actual).to.eq(dedent`
    // ***********************************************************
    // This example support/component.js is processed and
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

    import { mount } from 'cypress/vue'

    Cypress.Commands.add('mount', mount)

    // Example use:
    // cy.mount(MyComponent)
    `)
  })

  it('handles cypress/vue and TS (example no JSX)', () => {
    const actual = supportFileComponent('ts', findByMountingModule('cypress/vue'))

    expect(actual).to.eq(dedent`
    // ***********************************************************
    // This example support/component.ts is processed and
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

    import { mount } from 'cypress/vue'
    import type { MountReturn } from 'cypress/vue'

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

    // Example use:
    // cy.mount(MyComponent)
    `)
  })
})
