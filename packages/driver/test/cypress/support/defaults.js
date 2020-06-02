const { $ } = Cypress

beforeEach(() => {
  // remove all event listeners
  // from the window
  // this could fail if this window
  // is a cross origin window
  try {
    $(cy.state('window')).off()
  } catch (error) {} // eslint-disable-line no-empty
})
