// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain navigation', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  // FIXME: CypressError: Timed out after waiting `undefinedms` for your remote page to load.
  // Your page did not fire its `load` event within`undefinedms`.
  // You can try increasing the `pageLoadTimeout` value in `undefined` to wait longer.
  // Browsers will not fire the `load` event until all stylesheets and scripts are done downloading.
  // When this `load` event occurs, Cypress will continue running commands.
  // at timedOutWaitingForPageLoad(webpack:///../driver/src/cy/commands/navigation.ts?:59:72)
  // at eval (webpack:///../driver/src/cy/commands/navigation.ts?:1143:16)
  it.skip('.go()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.visit('/fixtures/generic.html')
      cy.go('back')
      cy.location('pathname').should('include', 'dom.html')
    })
  })

  it('.reload()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get(':checkbox[name="colors"][value="blue"]').check().should('be.checked')
      cy.reload()
      cy.get(':checkbox[name="colors"][value="blue"]').should('not.be.checked')
    })
  })

  // FIXME: CypressError: Timed out after waiting `undefinedms` for your remote page to load.
  // Your page did not fire its `load` event within `undefinedms`.
  // You can try increasing the `pageLoadTimeout` value in `undefined` to wait longer.
  // Browsers will not fire the `load` event until all stylesheets and scripts are done downloading.
  // When this `load` event occurs, Cypress will continue running commands.
  // at timedOutWaitingForPageLoad (webpack:///../driver/src/cy/commands/navigation.ts?:59:72)
  // at eval (webpack:///../driver/src/cy/commands/navigation.ts?:1143:16)
  it.skip('.visit()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.visit('/fixtures/generic.html')
    })
  })
})
