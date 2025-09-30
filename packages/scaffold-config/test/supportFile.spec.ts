import { describe, it, expect } from 'vitest'
import { supportFileComponent } from '../src/supportFile'
import dedent from 'dedent'

describe('supportFileComponent', () => {
  describe('react', () => {
    const mountModule = 'cypress/react'

    it(`handles ${mountModule} and JS`, () => {
      const actual = supportFileComponent('js', mountModule)

      expect(actual).toEqual(dedent`
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

          import { mount } from '${mountModule}'

          Cypress.Commands.add('mount', mount)

          // Example use:
          // cy.mount(<MyComponent />)
          `)
    })

    it(`handles ${mountModule} and TS`, () => {
      const actual = supportFileComponent('ts', mountModule)

      expect(actual).toEqual(dedent`
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

        // Example use:
        // cy.mount(<MyComponent />)
      `)
    })
  })

  describe('vue', () => {
    const mountModule = 'cypress/vue'

    it(`handles ${mountModule} and JS`, () => {
      const actual = supportFileComponent('js', mountModule)

      expect(actual).toEqual(dedent`
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

          import { mount } from '${mountModule}'

          Cypress.Commands.add('mount', mount)

          // Example use:
          // cy.mount(MyComponent)
          `)
    })

    it(`handles ${mountModule} and TS`, () => {
      const actual = supportFileComponent('ts', mountModule)

      expect(actual).toEqual(dedent`
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

        // Example use:
        // cy.mount(MyComponent)
      `)
    })
  })

  describe('angular', () => {
    for (const mountModule of ['cypress/angular'] as const) {
      it(`handles ${mountModule} and TS`, () => {
        const actual = supportFileComponent('ts', mountModule)

        expect(actual).toEqual(dedent`
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

        // Example use:
        // cy.mount(MyComponent)
      `)
      })
    }
  })

  describe('svelte', () => {
    it(`handles cypress/svelte and JS`, () => {
      const actual = supportFileComponent('js', 'cypress/svelte')

      expect(actual).toEqual(dedent`
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

          import { mount } from 'cypress/svelte'

          Cypress.Commands.add('mount', mount)

          // Example use:
          // cy.mount(MyComponent)
          `)
    })

    it(`handles cypress/svelte and TS`, () => {
      const actual = supportFileComponent('ts', 'cypress/svelte')

      expect(actual).toEqual(dedent`
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

        import { mount } from 'cypress/svelte'

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
})
