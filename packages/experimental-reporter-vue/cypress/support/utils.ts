import { EventEmitter } from 'events'
import { Editor } from '@packages/ui-components'
import CommandModel from './../../src/commands/command-model'

const { _ } = Cypress

interface File {
  file: string
  line: number
  column: number
}

interface HandlesFileOpeningProps {
  getRunner: Function
  selector: string
  file: File
  stackTrace?: boolean
}

export const itHandlesFileOpening = ({ getRunner, selector, file, stackTrace = false }: HandlesFileOpeningProps) => {
  beforeEach(() => {
    cy.stub(getRunner(), 'emit').callThrough()
  })

  describe('when user has already set opener and opens file', () => {
    let editor: Partial<Editor>

    beforeEach(() => {
      editor = {}

      // @ts-ignore
      getRunner().emit.withArgs('get:user:editor').yields({
        preferredOpener: editor,
      })

      if (stackTrace) {
        cy.contains('View stack trace').click()
      }
    })

    it('opens in preferred opener', () => {
      cy.get(selector).first().click().then(() => {
        expect(getRunner().emit).to.be.calledWith('open:file', {
          where: editor,
          ...file,
        })
      })
    })
  })

  describe('when user has not already set opener and opens file', () => {
    const availableEditors = [
      { id: 'computer', name: 'On Computer', isOther: false, openerId: 'computer' },
      { id: 'atom', name: 'Atom', isOther: false, openerId: 'atom' },
      { id: 'vim', name: 'Vim', isOther: false, openerId: 'vim' },
      { id: 'sublime', name: 'Sublime Text', isOther: false, openerId: 'sublime' },
      { id: 'vscode', name: 'Visual Studio Code', isOther: false, openerId: 'vscode' },
      { id: 'other', name: 'Other', isOther: true, openerId: '' },
    ]

    beforeEach(() => {
      // @ts-ignore
      getRunner().emit.withArgs('get:user:editor').yields({ availableEditors })
      // usual viewport of only reporter is a bit cramped for the modal
      cy.viewport(600, 600)

      if (stackTrace) {
        cy.contains('View stack trace').click()
      }

      cy.get(selector).first().click()
    })

    it('opens modal with available editors', () => {
      _.each(availableEditors, ({ name }) => {
        cy.contains(name)
      })

      cy.contains('Other')
      cy.contains('Set preference and open file')
    })

    // NOTE: this fails because mobx doesn't make the editors observable, so
    // the changes to the path don't bubble up correctly. this only happens
    // in the Cypress test and not when running the actual app
    it.skip('updates "Other" path when typed into', () => {
      cy.contains('Other').find('input[type="text"]').type('/absolute/path/to/foo.js')
      .should('have.value', '/absolute/path/to/foo.js')
    })

    describe('when editor is not selected', () => {
      it('disables submit button', () => {
        cy.contains('Set preference and open file')
        .should('have.class', 'is-disabled')
        .click()

        cy.wrap(getRunner().emit).should('not.to.be.calledWith', 'set:user:editor')
        cy.wrap(getRunner().emit).should('not.to.be.calledWith', 'open:file')
      })

      it('shows validation message when hovering over submit button', () => {
        cy.get('.editor-picker-modal .submit').trigger('mouseover')
        cy.get('.cy-tooltip').last().should('have.text', 'Please select a preference')
      })
    })

    describe('when Other is selected but path is not entered', () => {
      beforeEach(() => {
        cy.contains('Other').click()
      })

      it('disables submit button', () => {
        cy.contains('Set preference and open file')
        .should('have.class', 'is-disabled')
        .click()

        cy.wrap(getRunner().emit).should('not.to.be.calledWith', 'set:user:editor')
        cy.wrap(getRunner().emit).should('not.to.be.calledWith', 'open:file')
      })

      it('shows validation message when hovering over submit button', () => {
        cy.get('.editor-picker-modal .submit').trigger('mouseover')
        cy.get('.cy-tooltip').last().should('have.text', 'Please enter the path for the "Other" editor')
      })
    })

    describe('when editor is set', () => {
      beforeEach(() => {
        cy.contains('Visual Studio Code').click()
        cy.contains('Set preference and open file').click()
      })

      it('closes modal', function () {
        cy.contains('Set preference and open file').should('not.exist')
      })

      it('emits set:user:editor', () => {
        expect(getRunner().emit).to.be.calledWith('set:user:editor', availableEditors[4])
      })

      it('opens file in selected editor', () => {
        expect(getRunner().emit).to.be.calledWith('open:file', {
          where: availableEditors[4],
          ...file,
        })
      })
    })
  })
}

export const addCommand = (runner: EventEmitter, log: Partial<CommandModel>) => {
  const defaultLog = {
    event: false,
    hookId: 'r3',
    id: _.uniqueId('c'),
    instrument: 'command',
    renderProps: {},
    state: 'passed',
    testId: 'r3',
    testCurrentRetry: 0,
    type: 'parent',
    url: 'http://example.com',
  }

  runner.emit('reporter:log:add', Object.assign(defaultLog, log))
}
