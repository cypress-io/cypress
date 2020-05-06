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
      chosen: { id: 'vscode', name: 'VS Code', openerId: 'vscode', isOther: false },
      editors: [
        { id: 'computer', name: 'On Computer', openerId: 'computer', isOther: false, description: 'Opens on computer etc etc' },
        { id: 'atom', name: 'Atom', openerId: 'atom', isOther: false },
        { id: 'sublime', name: 'Sublime Text', openerId: 'sublime', isOther: false },
        { id: 'vscode', name: 'VS Code', openerId: 'vscode', isOther: false },
        { id: 'other', name: 'Other', openerId: '', isOther: true, description: 'Enter the full path etc etc' },
      ],
      onSelect: () => {},
    }

    cy.visit('dist/index.html')
    cy.viewport(400, 600)
  })

  it('renders each specified editor', () => {
    cy.render(render, <EditorPicker {...defaultProps} />)

    cy.contains('On Computer')
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

  // this doesn't work currently because the tooltip renders in the spec
  // iframe and not the AUT iframe. need to switch to cypress-react-unit-test
  // or something similar to get this to work
  it.skip('shows info circle with desciption tooltip when specified', () => {
    cy.render(render, <EditorPicker {...defaultProps} />)

    cy.get('.fa-info-circle').trigger('mouseover')
    cy.get('.cy-tooltip')
    .should('be.visible')
    .should('have.text', 'Opens on computer etc etc')
  })

  it('calls onSelect when option is chosen', () => {
    const onSelect = cy.stub()

    cy.render(render, <EditorPicker {...defaultProps} onSelect={onSelect}/>)

    cy.contains('Sublime Text').click().then(() => {
      expect(onSelect).to.be.calledWith(defaultProps.editors[2])
    })
  })

  describe('"Other" handling', () => {
    it('shows description when chosen', () => {
      cy.render(render, <EditorPicker {...defaultProps} chosen={defaultProps.editors[4]}/>)

      cy.contains('Enter the full path').should('be.visible')
    })

    it('selects item when focusing text input', () => {
      cy.render(render, <EditorPicker {...defaultProps} chosen={defaultProps.editors[4]}/>)

      cy.contains('Other').find('input[type="text"]').focus()
      cy.contains('Other').find('input[type="radio"]').should('be.checked')
    })

    it('populates path if specified', () => {
      defaultProps.editors[4].openerId = '/path/to/my/editor'
      cy.render(render, <EditorPicker {...defaultProps} chosen={defaultProps.editors[4]}/>)

      cy.contains('Other').find('input[type="text"]').should('have.value', '/path/to/my/editor')
    })

    describe('typing path', () => {
      const path = '/path/to/my/editor'
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

      it('trims the path', () => {
        const onSelect = cy.stub()

        cy.render(render, <Wrapper onSelectSpy={onSelect} />)

        cy.contains('Other').find('input[type="text"]').type(`   ${path}  `, { delay: 0 })
        .should(() => {
          expect(onSelect.lastCall.args[0].openerId).to.equal(path)
        })
      })

      it('calls onSelect for every character typed', () => {
        const onSelect = cy.stub()

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
})
