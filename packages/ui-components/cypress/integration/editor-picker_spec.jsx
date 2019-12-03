import React, { useState } from 'react'
import { render } from 'react-dom'
import { EditorPicker } from '../../'

const _ = Cypress._

describe('<EditorPicker />', () => {
  let defaultProps

  beforeEach(() => {
    defaultProps = {
      chosen: { id: 'vscode', name: 'VS Code' },
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

  it('renders each specified editor', () => {
    cy.render(render, <EditorPicker {...defaultProps} />)

    cy.contains('Atom')
    cy.contains('Sublime Text')
    cy.contains('VS Code')
    cy.contains('Other')
  })

  it('has chosen editor selected', () => {
    cy.render(render, <EditorPicker {...defaultProps} />)

    cy.contains('VS Code').find('input').should('be.checked')
  })

  it('calls onSelect when option is chosen', () => {
    const onSelect = cy.stub()

    cy.render(render, <EditorPicker {...defaultProps} onSelect={onSelect}/>)

    cy.contains('Sublime Text').click().then(() => {
      expect(onSelect).to.be.calledWith({ id: 'sublime', name: 'Sublime Text' })
    })
  })

  describe('"Other" handling', () => {
    it('shows description when chosen', () => {
      cy.render(render, <EditorPicker {...defaultProps} chosen={defaultProps.editors[3]}/>)

      cy.contains('Enter the full path').should('be.visible')
    })

    it('selects item when focusing text input', () => {
      cy.render(render, <EditorPicker {...defaultProps} chosen={defaultProps.editors[3]}/>)

      cy.contains('Other').find('input[type="text"]').focus()
      cy.contains('Other').find('input[type="radio"]').should('be.checked')
    })

    it('populates path if specified', () => {
      defaultProps.editors[3].path = '/path/to/my/editor'
      cy.render(render, <EditorPicker {...defaultProps} chosen={defaultProps.editors[3]}/>)

      cy.contains('Other').find('input[type="text"]').should('have.value', '/path/to/my/editor')
    })

    it('calls onSelect for every character typed', () => {
      const Wrapper = ({ onSelectSpy }) => {
        const [editors, setEditors] = useState(_.cloneDeep(defaultProps.editors))
        const [chosen, setChosen] = useState(editors[3])

        const onSelect = (value) => {
          const newEditors = _.cloneDeep(editors)

          newEditors[3].path = value.path
          setEditors(newEditors)
          setChosen(value)
          onSelectSpy(value)
        }

        return (
          <EditorPicker {...defaultProps} editors={editors} chosen={chosen} onSelect={onSelect}/>
        )
      }

      const onSelect = cy.stub()
      const path = '/path/to/my/editor'

      cy.render(render, <Wrapper onSelectSpy={onSelect} />)
      cy.contains('Other').find('input[type="text"]').type(path, { delay: 0 })

      _.each(path.split(''), (letter, i) => {
        const typedSoFar = path.substring(0, i + 1)

        cy.wrap(onSelect).should('be.calledWith', {
          id: 'other', name: 'Other', isOther: true, path: typedSoFar,
        })
      })
    })
  })
})
