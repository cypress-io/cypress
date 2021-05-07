describe('issue 1244', () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-1244.html').then(() => {
      cy.on('window:before:unload', (e) => {
        const win = cy.state('window')

        expect(win.getCounters()).to.deep.equal({ getCounter: 0, setCounter: 0 })
      })
    })
  })

  for (const [el, target, action] of [['button', 'form', 'submit'], ['a', 'a', 'click']]) {
    // <form> submit, <a> click
    describe(`<${target}> ${action}`, () => {
      it('correctly redirects when target=_top with target.target =', () => {
        cy.get(`${el}.setTarget`).click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('correctly redirects when target=_top with setAttribute', () => {
        cy.get(`${el}.setAttr`).click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('correctly redirects when target=_top inline in dom', () => {
        cy.get(`${el}.inline_top`).click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('correctly redirects when target=_parent inline in dom', () => {
        cy.get(`${el}.inline_parent`).click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('maintains behavior when target=_self', () => {
        cy.get(`${el}.inline_self`).click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('maintains behavior when target=_blank,invalid', () => {
        cy.get(`${el}.inline_blank`).click().then(() => {
          cy.url().should('not.include', 'dom.html')
        })

        cy.get(`${el}.inline_invalid`).click().then(() => {
          cy.url().should('not.include', 'dom.html')
        })
      })
    })
  }
})
