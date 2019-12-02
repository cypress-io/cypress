import React from 'react'
import { render } from 'react-dom'
import { EditorPicker } from '../../'

describe('<EditorPicker />', () => {
  let defaultProps

  beforeEach(() => {
    defaultProps = {
      chosenEditor: { id: 'vscode', name: 'VS Code' },
      editors: [
        { id: 'atom', name: 'Atom' },
        { id: 'sublime', name: 'Sublime Text' },
        { id: 'vscode', name: 'VS Code' },
        { id: 'other', name: 'Other', path: '', isOther: true },
      ],
      onSelect: () => {},
    }

    cy.visit('dist/index.html')
    cy.viewport(400, 600)
  })

  it('renders a dropdown with specified editors', () => {
    cy.render(render, <EditorPicker {...defaultProps} />)

    cy.get('option').eq(1).should('have.text', 'Atom')
    cy.get('option').eq(2).should('have.text', 'Sublime Text')
    cy.get('option').eq(3).should('have.text', 'VS Code')
    cy.get('option').eq(4).should('have.text', 'Other')
  })

  it('has chosen editor selected', () => {
    cy.render(render, <EditorPicker {...defaultProps} />)

    cy.get('select').should('have.value', 'vscode')
  })

  it('defaults to "Select an Editor" if not option chosen', () => {
    cy.render(render, <EditorPicker {...defaultProps} chosenEditor={undefined}/>)

    cy.get('select').should('have.value', 'none')
    cy.get('[value=none]').should('have.text', '--- Select an Editor ---')
  })

  it('calls onSelect when option is chosen', () => {
    const onSelect = cy.stub()

    cy.render(render, <EditorPicker {...defaultProps} onSelect={onSelect}/>)

    cy.get('select').select('sublime').then(() => {
      expect(onSelect).to.be.calledWith({ id: 'sublime', name: 'Sublime Text' })
    })
  })

  describe('"Other" handling', () => {
    it('shows text input when chosen', () => {
      cy.render(render, <EditorPicker {...defaultProps} chosenEditor={defaultProps.editors[3]}/>)

      cy.contains('Enter the full path')
      cy.get('input').should('be.visible')
    })

    it('populates path if specified', () => {
      defaultProps.editors[3].path = '/path/to/my/editor'
      cy.render(render, <EditorPicker {...defaultProps} chosenEditor={defaultProps.editors[3]}/>)

      cy.get('input').should('have.value', '/path/to/my/editor')
    })

    it('calls onSelect for every character typed', () => {
      const onSelect = cy.stub()
      const path = '/path/to/my/editor'
      const chosenEditor = defaultProps.editors[3]

      cy.render(render, <EditorPicker {...defaultProps} chosenEditor={chosenEditor} onSelect={onSelect}/>)

      path.split('').forEach((letter, i) => {
        const typedSoFar = path.substring(0, i + 1)

        cy.get('input').type(letter, { delay: 0 })
        cy.wrap(onSelect).should('be.calledWith', {
          id: 'other', name: 'Other', isOther: true, path: typedSoFar,
        })

        cy.render(render, <EditorPicker {...defaultProps} chosenEditor={chosenEditor} onSelect={onSelect} path={typedSoFar} />)
      })
    })
  })
})
