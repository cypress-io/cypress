// The HTML `<base target>` attribute is inherited by every untargeted <a> / <form>
// on the page. A value of `_top` or `_parent` navigates the AUT out of the Cypress
// iframe, so the proxy's HTML rewriter strips the attribute at load time and the
// driver runtime guard strips it from any `<base>` inserted after load.
describe('<base target="_top|_parent">', { browser: '!webkit' }, () => {
  it('keeps anchor click inside AUT when <base target="_top"> is in source HTML', () => {
    cy.visit('/fixtures/base-target-top.html')
    cy.get('#link').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })

  it('keeps form submit inside AUT when <base target="_top"> is in source HTML', () => {
    cy.visit('/fixtures/base-target-top.html')
    cy.get('#submit').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })

  it('keeps anchor click inside AUT when <base target="_parent"> is in source HTML', () => {
    cy.visit('/fixtures/base-target-parent.html')
    cy.get('#link').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })

  it('keeps anchor click inside AUT when <base target="_top"> is injected after load', () => {
    cy.visit('/fixtures/base-target-dynamic.html')
    cy.window().then((win) => win.injectBase('_top'))
    cy.get('#link').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })

  it('keeps form submit inside AUT when <base target="_parent"> is injected after load', () => {
    cy.visit('/fixtures/base-target-dynamic.html')
    cy.window().then((win) => win.injectBase('_parent'))
    cy.get('#submit').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })
})
