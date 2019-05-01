Cypress.Commands.addAll({ prevSubject: 'element' }, {
  pseudo (subject, pseudoSel) {
    const win = Cypress.dom.getWindowByElement(subject.get(0))

    cy.wrap(win.getComputedStyle(subject.get(0), pseudoSel))
  },
})
