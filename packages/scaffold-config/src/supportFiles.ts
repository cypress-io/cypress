/// <reference types="node" />
export interface ScaffoldComponentSupportOptions {
  framework: 'vue' | 'react'
  typescript: boolean
}

export function scaffoldComponentSupportFile (options: ScaffoldComponentSupportOptions) {
  const prettier = require('prettier') as typeof import('prettier')

  return prettier.format(`
  import { mount } from 'cypress/${options.framework}'

  ${options.typescript
    ? `
    declare global {
      namespace Cypress {
        interface Chainable {
          // Adds a cy.mount() for the ${options.framework} library.
          // check the types & documentation for the given signature 
          mount: typeof mount
        }
      }
    }
    ` : ''
  }

  Cypress.Commands.add('mount', mount)
  `, {
    parser: 'typescript',
  })
}
