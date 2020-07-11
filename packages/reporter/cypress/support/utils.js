const _ = Cypress._

export const itHandlesFileOpening = (selector, file, stackTrace = false) => {
  beforeEach(function () {
    cy.stub(this.runner, 'emit').callThrough()
  })

  describe('when user has already set opener and opens file', function () {
    beforeEach(function () {
      this.editor = {}

      this.runner.emit.withArgs('get:user:editor').yields({
        preferredOpener: this.editor,
      })

      if (stackTrace) {
        cy.contains('View stack trace').click()
      }
    })

    it('opens in preferred opener', function () {
      cy.get(selector).first().click().then(() => {
        expect(this.runner.emit).to.be.calledWith('open:file', {
          where: this.editor,
          ...file,
        })
      })
    })
  })

  describe('when user has not already set opener and opens file', function () {
    const availableEditors = [
      { id: 'computer', name: 'On Computer', isOther: false, openerId: 'computer' },
      { id: 'atom', name: 'Atom', isOther: false, openerId: 'atom' },
      { id: 'vim', name: 'Vim', isOther: false, openerId: 'vim' },
      { id: 'sublime', name: 'Sublime Text', isOther: false, openerId: 'sublime' },
      { id: 'vscode', name: 'Visual Studio Code', isOther: false, openerId: 'vscode' },
      { id: 'other', name: 'Other', isOther: true, openerId: '' },
    ]

    beforeEach(function () {
      this.runner.emit.withArgs('get:user:editor').yields({ availableEditors })
      // usual viewport of only reporter is a bit cramped for the modal
      cy.viewport(600, 600)

      if (stackTrace) {
        cy.contains('View stack trace').click()
      }

      cy.get(selector).first().click()
    })

    it('opens modal with available editors', function () {
      _.each(availableEditors, ({ name }) => {
        cy.contains(name)
      })

      cy.contains('Other')
      cy.contains('Set preference and open file')
    })

    // NOTE: this fails because mobx doesn't make the editors observable, so
    // the changes to the path don't bubble up correctly. this only happens
    // in the Cypress test and not when running the actual app
    it.skip('updates "Other" path when typed into', function () {
      cy.contains('Other').find('input[type="text"]').type('/absolute/path/to/foo.js')
      .should('have.value', '/absolute/path/to/foo.js')
    })

    describe('when editor is not selected', function () {
      it('disables submit button', function () {
        cy.contains('Set preference and open file')
        .should('have.class', 'is-disabled')
        .click()

        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'set:user:editor')
        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'open:file')
      })

      it('shows validation message when hovering over submit button', function () {
        cy.get('.editor-picker-modal .submit').trigger('mouseover')
        cy.get('.cy-tooltip').last().should('have.text', 'Please select a preference')
      })
    })

    describe('when Other is selected but path is not entered', function () {
      beforeEach(function () {
        cy.contains('Other').click()
      })

      it('disables submit button', function () {
        cy.contains('Set preference and open file')
        .should('have.class', 'is-disabled')
        .click()

        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'set:user:editor')
        cy.wrap(this.runner.emit).should('not.to.be.calledWith', 'open:file')
      })

      it('shows validation message when hovering over submit button', function () {
        cy.get('.editor-picker-modal .submit').trigger('mouseover')
        cy.get('.cy-tooltip').last().should('have.text', 'Please enter the path for the "Other" editor')
      })
    })

    describe('when editor is set', function () {
      beforeEach(function () {
        cy.contains('Visual Studio Code').click()
        cy.contains('Set preference and open file').click()
      })

      it('closes modal', function () {
        cy.contains('Set preference and open file').should('not.be.visible')
      })

      it('emits set:user:editor', function () {
        expect(this.runner.emit).to.be.calledWith('set:user:editor', availableEditors[4])
      })

      it('opens file in selected editor', function () {
        expect(this.runner.emit).to.be.calledWith('open:file', {
          where: availableEditors[4],
          ...file,
        })
      })
    })
  })
}
