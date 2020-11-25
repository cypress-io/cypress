import React from 'react'
import { render } from 'react-dom'

import { FileOpener } from '../../'

const _ = Cypress._

const fileDetails = {
  absoluteFile: '/absolute/path/to/file_spec.js',
  column: 0,
  line: 0,
  originalFile: 'path/to/file_spec.js',
  relativeFile: 'path/to/file_spec.js',
}

const preferredOpener = {
  id: 'vscode',
  name: 'VS Code',
  openerId: 'vscode',
  isOther: false,
}

const availableEditors = [
  { id: 'computer', name: 'On Computer', openerId: 'computer', isOther: false, description: 'Opens on computer etc etc' },
  { id: 'atom', name: 'Atom', openerId: 'atom', isOther: false },
  { id: 'sublime', name: 'Sublime Text', openerId: 'sublime', isOther: false },
  { id: 'vscode', name: 'VS Code', openerId: 'vscode', isOther: false },
  { id: 'other', name: 'Other', openerId: '', isOther: true, description: 'Enter the full path etc etc' },
]

describe('<FileOpener />', () => {
  let defaultProps

  beforeEach(() => {
    defaultProps = {
      fileDetails,
      openFile: () => {},
      getUserEditor: (callback) => {
        callback({
          preferredOpener,
          availableEditors,
        })
      },
      setUserEditor: () => {},
      className: 'file-opener',
    }

    cy.visit('dist/index.html')
    cy.viewport(600, 600)
  })

  it('renders link text', () => {
    cy.render(render, <FileOpener {...defaultProps}>Open in IDE</FileOpener>)

    cy.get('.file-opener').should('have.text', 'Open in IDE')
  })

  context('when user has already set opener and opens file', () => {
    it('opens in preferred opener', () => {
      const openFile = cy.stub()

      cy.render(render, <FileOpener {...defaultProps} openFile={openFile}>Open in IDE</FileOpener>)

      cy.get('.file-opener').click().then(() => {
        expect(openFile).to.be.calledWith(preferredOpener, fileDetails)
      })
    })
  })

  context('when user has not already set opener and opens file', () => {
    let defaultPropsModal

    beforeEach(() => {
      defaultPropsModal = {
        ...defaultProps,
        getUserEditor: (callback) => {
          callback({
            availableEditors,
          })
        },
      }
    })

    it('opens modal with available editors', () => {
      cy.render(render, <FileOpener {...defaultPropsModal}>Open in IDE</FileOpener>)

      cy.get('.file-opener').click()

      _.each(availableEditors, ({ name }) => {
        cy.contains(name)
      })

      cy.contains('Set preference and open file')
    })

    it('closes modal when cancel is clicked', () => {
      cy.render(render, <FileOpener {...defaultPropsModal}>Open in IDE</FileOpener>)

      cy.get('.file-opener').click()
      cy.contains('Sublime Text').click()
      cy.contains('Cancel').click()
      cy.contains('Set preference and open file').should('not.exist')
    })

    it('initially has no editors chosen', () => {
      cy.render(render, <FileOpener {...defaultPropsModal}>Open in IDE</FileOpener>)

      cy.get('.file-opener').click()
      cy.get('input[type="radio"]').should('not.be.checked')
      cy.get('.submit').should('have.class', 'is-disabled')
    })

    it('should not open without editor selected', () => {
      const setEditor = cy.stub()
      const openFile = cy.stub()

      cy.render(render, <FileOpener {...defaultPropsModal} setEditor={setEditor} openFile={openFile}>Open in IDE</FileOpener>)

      cy.get('.file-opener').click()
      cy.get('.submit')
      .should('have.class', 'is-disabled')
      .click()
      .then(() => {
        expect(setEditor).not.to.be.called
        expect(openFile).not.to.be.called
      })
    })

    it('disables submit when Other is selected but path not entered', () => {
      const setEditor = cy.stub()
      const openFile = cy.stub()

      cy.render(render, <FileOpener {...defaultPropsModal} setEditor={setEditor} openFile={openFile}>Open in IDE</FileOpener>)

      cy.get('.file-opener').click()
      cy.contains('Other').click()
      cy.get('.submit')
      .should('have.class', 'is-disabled')
      .click()
      .then(() => {
        expect(setEditor).not.to.be.called
        expect(openFile).not.to.be.called
      })
    })

    it('sets user editor when selected', () => {
      const setEditor = cy.stub()

      cy.render(render, <FileOpener {...defaultPropsModal} setUserEditor={setEditor}>Open in IDE</FileOpener>)

      cy.get('.file-opener').click()
      cy.contains('Sublime Text').click()
      cy.get('.submit').click().then(() => {
        expect(setEditor).to.be.calledWith(availableEditors[2])
      })
    })

    it('opens in correct editor when selected', () => {
      const openFile = cy.stub()

      cy.render(render, <FileOpener {...defaultPropsModal} openFile={openFile}>Open in IDE</FileOpener>)

      cy.get('.file-opener').click()
      cy.contains('Sublime Text').click()
      cy.get('.submit').click().then(() => {
        expect(openFile).to.be.calledWith(availableEditors[2], fileDetails)
      })
    })

    it('closes modal after selection', () => {
      cy.render(render, <FileOpener {...defaultPropsModal}>Open in IDE</FileOpener>)

      cy.get('.file-opener').click()
      cy.contains('Sublime Text').click()
      cy.get('.submit').click()
      cy.contains('Set preference and open file').should('not.exist')
    })
  })
})
