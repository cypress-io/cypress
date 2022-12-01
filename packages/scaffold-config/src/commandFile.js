'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.commandsFileBody = void 0

const tslib_1 = require('tslib')
const dedent_1 = tslib_1.__importDefault(require('dedent'))
const COMMAND_TYPES = (0, dedent_1.default) `
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
`

function commandsFileBody (language) {
  return (0, dedent_1.default) `
    ${language === 'ts' ? '/// <reference types="cypress" />' : ''}
    // ***********************************************
    // This example commands.${language} shows you how to
    // create various custom commands and overwrite
    // existing commands.
    //
    // For more comprehensive examples of custom
    // commands please read more here:
    // https://on.cypress.io/custom-commands
    // ***********************************************
    //
    //
    // -- This is a parent command --
    // Cypress.Commands.add('login', (email, password) => { ... })
    //
    //
    // -- This is a child command --
    // Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
    //
    //
    // -- This is a dual command --
    // Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
    //
    //
    // -- This will overwrite an existing command --
    // Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
    ${language === 'ts' ? COMMAND_TYPES : ''}
  `
}
exports.commandsFileBody = commandsFileBody
