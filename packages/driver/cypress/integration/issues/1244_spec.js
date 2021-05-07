describe('issue 1244', () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-1244.html').then(() => {
      cy.on('window:before:unload', (e) => {
        const win = cy.state('window')

        expect(win.getCounters()).to.deep.equal({ getCounter: 0, setCounter: 0 })
      })
    })
  })

  describe('<form> submit', () => {
    it('correctly redirects when target=_top with target.target =', () => {
      cy.get('button.setTarget').click()
      cy.get('#dom').should('contain', 'DOM')
      cy.url().should('include', 'dom.html')
    })

    it('correctly redirects when target=_top with setAttribute', () => {
      cy.get('button.setAttr').click()
      cy.get('#dom').should('contain', 'DOM')
      cy.url().should('include', 'dom.html')
    })

    it('correctly redirects when target=_top inline in dom', () => {
      cy.get('button.inline').click()
      cy.get('#dom').should('contain', 'DOM')
      cy.url().should('include', 'dom.html')
    })
  })

  describe('<a> click', () => {
    it('correctly redirects when target=_top with target.target =', () => {
      cy.get('a.setTarget').click()
      cy.get('#dom').should('contain', 'DOM')
      cy.url().should('include', 'dom.html')
    })

    it('correctly redirects when target=_top with setAttribute', () => {
      cy.get('a.setAttr').click()
      cy.get('#dom').should('contain', 'DOM')
      cy.url().should('include', 'dom.html')
    })

    it('correctly redirects when target=_top inline in dom', () => {
      cy.get('a.inline').click()
      cy.get('#dom').should('contain', 'DOM')
      cy.url().should('include', 'dom.html')
    })
  })
})
