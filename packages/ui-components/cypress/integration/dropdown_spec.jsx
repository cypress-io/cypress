import React from 'react'

describe('<Dropdown />', () => {
  let render

  beforeEach(() => {
    const defaultProps = {
      chosen: { name: 'First' },
      others: [{ name: 'Second' }, { name: 'Third' }],
      keyProperty: 'name',
      renderItem: ({ name }) => name,
      onSelect: () => {},
    }

    render = (props = {}) => {
      cy.visit('dist/index.html')
      cy.window().invoke('renderDropdown', Object.assign({}, defaultProps, props))
    }

    cy.viewport(400, 600)
  })

  it('displays chosen option and hides others', () => {
    render()

    cy.contains('First').should('be.visible')
    cy.contains('Second').should('not.be.visible')
    cy.contains('Third').should('not.be.visible')
  })

  it('shows others after clicking chosen option', () => {
    render()

    cy.contains('First').click()
    cy.contains('Second').should('be.visible')
    cy.contains('Third').should('be.visible')
  })

  it('calls onSelect after clicking option', () => {
    const onSelect = cy.stub()

    render({ onSelect })

    cy.contains('First').click()
    cy.contains('Second').click().then(() => {
      expect(onSelect).to.be.calledWith({ name: 'Second' })
    })
  })

  it('applies className to container', () => {
    render({ className: 'custom-class' })

    cy.get('.dropdown').should('have.class', 'custom-class')
  })

  it('renders item as specified by renderItem prop', () => {
    render({ renderItem: ({ name }) => <span>{name}</span> })

    cy.contains('First').children().should('match', 'span')
    cy.contains('Second').should('match', 'span')
    cy.contains('Third').should('match', 'span')
  })

  it('renders caret if there are items', () => {
    render()

    cy.get('.dropdown-caret')
  })

  it('does not render caret if there are no items', () => {
    render({ others: [] })

    cy.get('.dropdown-caret').should('not.exist')
  })

  it('disables if disabled specified and does not render options or caret', () => {
    render({ disabled: true })

    cy.contains('First').should('have.class', 'disabled').click({ force: true })
    cy.get('.dropdown li').should('not.exist')
    cy.get('.dropdown-caret').should('not.exist')
  })

  it('closes dropdown when clicking outside of it', () => {
    render()

    cy.contains('First').click()
    cy.get('body').click()
    cy.contains('Second').should('not.be.visible')
  })
})
