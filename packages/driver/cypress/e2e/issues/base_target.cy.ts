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
    cy.window().then((win: any) => win.injectBase('_top'))
    cy.get('#link').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })

  it('keeps form submit inside AUT when <base target="_parent"> is injected after load', () => {
    cy.visit('/fixtures/base-target-dynamic.html')
    cy.window().then((win: any) => win.injectBase('_parent'))
    cy.get('#submit').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })

  // The HTML navigation algorithm matches `_top` / `_parent` ASCII case-insensitively,
  // so a mixed-case value is just as obstructive as the lowercase form.
  it('keeps anchor click inside AUT when <base target="_TOP"> (uppercase) is injected after load', () => {
    cy.visit('/fixtures/base-target-dynamic.html')
    cy.window().then((win: any) => win.injectBase('_TOP'))
    cy.get('#link').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })

  // A click on a descendant of an anchor (e.g. `<a><span>`) sets `e.target` to
  // the descendant rather than the anchor. The navigation still bubbles up to
  // the <a> and inherits the document's base target, so the base-level
  // neutralization must run independently of the per-element tag check.
  it('keeps click-on-anchor-child inside AUT when <base target="_top"> is injected after load', () => {
    cy.visit('/fixtures/base-target-dynamic.html')
    cy.window().then((win: any) => win.injectBase('_top'))
    cy.get('#nested-link-child').click()
    cy.get('#dom').should('contain', 'DOM')
    cy.url().should('include', 'dom.html')
  })
})
