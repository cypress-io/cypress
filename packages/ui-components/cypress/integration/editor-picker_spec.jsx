import chaiSubset from 'chai-subset'
import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import { render } from 'react-dom'
import React from 'react'

import { EditorPicker } from '../../'

chai.use(chaiSubset)

const _ = Cypress._

describe('<EditorPicker />', () => {
  let defaultProps

  beforeEach(() => {
    defaultProps = {
      chosen: { id: 'vscode', name: 'VS Code', openerId: 'vscode' },
      editors: [
        { id: 'atom', name: 'Atom', openerId: 'atom' },
        { id: 'sublime', name: 'Sublime Text', openerId: 'sublime' },
        { id: 'vscode', name: 'VS Code', openerId: 'vscode' },
        { id: 'other', name: 'Other', openerId: '', isOther: true },
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

  it('has none chosen if not specified', () => {
    cy.render(render, <EditorPicker {...defaultProps} chosen={undefined} />)

    cy.get('input[type="radio"]').should('not.be.checked')
  })

  it('calls onSelect when option is chosen', () => {
    const onSelect = cy.stub()

    cy.render(render, <EditorPicker {...defaultProps} onSelect={onSelect}/>)

    cy.contains('Sublime Text').click().then(() => {
      expect(onSelect).to.be.calledWith({ id: 'sublime', name: 'Sublime Text', openerId: 'sublime' })
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
      defaultProps.editors[3].openerId = '/path/to/my/editor'
      cy.render(render, <EditorPicker {...defaultProps} chosen={defaultProps.editors[3]}/>)

      cy.contains('Other').find('input[type="text"]').should('have.value', '/path/to/my/editor')
    })

    it('calls onSelect for every character typed', () => {
      const Wrapper = observer(({ onSelectSpy }) => {
        const state = useLocalStore(() => ({
          editors: defaultProps.editors,
          setChosenEditor: action((editor) => {
            state.chosenEditor = editor
          }),
          setOtherPath: action((otherPath) => {
            const otherOption = _.find(state.editors, { isOther: true })

            otherOption.openerId = otherPath
          }),
        }))

        const onSelect = (chosen) => {
          state.setChosenEditor(chosen)
          onSelectSpy(chosen)
        }

        return (
          <EditorPicker
            {...defaultProps}
            editors={state.editors}
            chosen={state.chosen}
            onSelect={onSelect}
            onUpdateOtherPath={state.setOtherPath}
          />
        )
      })

      const onSelect = cy.stub()
      const path = '/path/to/my/editor'

      cy.render(render, <Wrapper onSelectSpy={onSelect} />)

      _.each(path.split(''), (letter, i) => {
        const pathSoFar = path.substring(0, i + 1)

        cy.contains('Other').find('input[type="text"]').type(letter, { delay: 0 })
        .should(() => {
          expect(onSelect.lastCall.args[0].id).to.equal('other')
          expect(onSelect.lastCall.args[0].openerId).to.equal(pathSoFar)
        })
      })
    })
  })
})
