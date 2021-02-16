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
