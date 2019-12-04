import React from 'react'
import { render } from 'react-dom'
import { Dropdown } from '../../'

describe('<Dropdown />', () => {
  let defaultProps

  beforeEach(() => {
    defaultProps = {
      chosen: { name: 'First' },
      others: [{ name: 'Second' }, { name: 'Third' }],
      keyProperty: 'name',
      renderItem: ({ name }) => name,
      onSelect: () => {},
    }

    cy.visit('dist/index.html')

    cy.viewport(400, 600)
  })

  it('displays chosen option and hides others', () => {
    cy.render(render, <Dropdown {...defaultProps} />)

    cy.contains('First').should('be.visible')
    cy.contains('Second').should('not.be.visible')
    cy.contains('Third').should('not.be.visible')
  })

  it('shows others after clicking chosen option', () => {
    cy.render(render, <Dropdown {...defaultProps} />)

    cy.contains('First').click()
    cy.contains('Second').should('be.visible')
    cy.contains('Third').should('be.visible')
  })

  it('calls onSelect after clicking option', () => {
    const onSelect = cy.stub()

    cy.render(render, <Dropdown {...defaultProps} onSelect={onSelect} />)

    cy.contains('First').click()
    cy.contains('Second').click().then(() => {
      expect(onSelect).to.be.calledWith({ name: 'Second' })
    })
  })

  it('applies className to container', () => {
    cy.render(render, <Dropdown {...defaultProps} className="custom-class" />)

    cy.get('.dropdown').should('have.class', 'custom-class')
  })

  it('renders item as specified by renderItem prop', () => {
    cy.render(render, <Dropdown {...defaultProps} renderItem={({ name }) => <span>{name}</span>} />)

    cy.contains('First').children().should('match', 'span')
    cy.contains('Second').should('match', 'span')
    cy.contains('Third').should('match', 'span')
  })

  it('renders caret if there are items', () => {
    cy.render(render, <Dropdown {...defaultProps} />)

    cy.get('.dropdown-caret')
  })

  it('does not render caret if there are no items', () => {
    cy.render(render, <Dropdown {...defaultProps} others={[]}/>)

    cy.get('.dropdown-caret').should('not.exist')
  })

  it('disables if disabled specified and does not render options or caret', () => {
    cy.render(render, <Dropdown {...defaultProps} disabled/>)

    cy.contains('First').should('have.class', 'disabled').click({ force: true })
    cy.get('.dropdown li').should('not.exist')
    cy.get('.dropdown-caret').should('not.exist')
  })

  it('closes dropdown when clicking outside of it', () => {
    cy.document().then((doc) => {
      cy.render(render, <Dropdown {...defaultProps} document={doc} />)
    })

    cy.contains('First').click()
    cy.get('body').click()
    cy.contains('Second').should('not.be.visible')
  })
})
