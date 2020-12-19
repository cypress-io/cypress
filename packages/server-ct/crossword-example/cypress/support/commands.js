// ***********************************************
// This example commands.js shows you how to
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
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('getCrossword', { prevSubject: 'element' }, (subject, options) => {
  cy.get('input').then((inputs) => {
    return Array.from(inputs.map((idx, el) => el.value)).join('')
  })
})

Cypress.Commands.add('fillCrossword', { prevSubject: 'element' }, (subject, options = {}) => {
  options.crossword = Cypress.vueWrapper.vm.$store.state.crossword
  cy.get('input').then((inputs) => {
    const cells = options.partially ? options.crossword.rows[0] : options.crossword.cells

    cells.forEach(({ letter, index }) => {
      if (letter !== '.') {
        inputs[index].value = letter
      }
    })
  })
})
