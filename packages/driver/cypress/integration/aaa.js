describe('event-triggering', () => {
  it('should trigger KeyboardEvent with .trigger inside Cypress event listener', (done) => {
    cy.visit('fixtures/issue-5650.html')

    cy.window().then((win) => {
      cy.get('#test-input').then((jQueryElement) => {
        let elemHtml = jQueryElement.get(0)

        elemHtml.addEventListener('keydown', (event) => {
          expect(event instanceof win['KeyboardEvent']).to.be.true
          done()
        })
      })
    })

    cy.get('#test-input').trigger('keydown', {
      keyCode: 65,
      which: 65,
      shiftKey: false,
      ctrlKey: false,
    })
  })

  it('should trigger KeyboardEvent with .trigger inside html script event listener', () => {
    cy.visit('fixtures/issue-5650.html')

    cy.get('#test-input').trigger('keydown', {
      keyCode: 65,
      which: 65,
      shiftKey: false,
      ctrlKey: false,
    })

    cy.get('#result').contains('isKeyboardEvent: true')
  })

  it('should trigger MouseEvent with .trigger inside Cypress event listener', (done) => {
    cy.visit('fixtures/issue-5650.html')
    // Add event listener

    cy.window().then((win) => {
      cy.get('#test-input').then((jQueryElement) => {
        let elem = jQueryElement.get(0)

        elem.addEventListener('mousedown', (event) => {
          expect(event instanceof win['MouseEvent']).to.be.true
          done()
        })
      })
    })

    cy.get('#test-input').trigger('mousedown', {
      button: 0,
      shiftKey: false,
      ctrlKey: false,
    })
  })

  it('should trigger MouseEvent with .trigger inside html script event listener', () => {
    cy.visit('fixtures/issue-5650.html')
    cy.get('#test-input').trigger('mousedown', {
      button: 0,
      shiftKey: false,
      ctrlKey: false,
    })

    cy.get('#result').contains('isMouseEvent: true')
  })
})
