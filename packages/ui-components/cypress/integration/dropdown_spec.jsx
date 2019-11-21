import React from 'react'

import { Dropdown } from '../../index'

const injectStyles = () => {
  cy.task('render:scss', 'dropdown.scss').then((css) => {
    cy.get('head').then(($head) => {
      $head.append(`<style>${css}</style>`)
    })
  })
}

describe('<Dropdown />', () => {
  let mount

  beforeEach(() => {
    const defaultProps = {
      chosen: { name: 'First' },
      others: [{ name: 'Second' }, { name: 'Third' }],
      keyProperty: 'name',
      renderItem: ({ name }) => name,
      onSelect: () => {},
    }

    mount = (props = {}) => {
      cy.mount(<Dropdown {...Object.assign({}, defaultProps, props)} />)

      injectStyles()
    }

    cy.viewport(400, 600)
  })

  it('displays chosen option and hides others', () => {
    mount()

    cy.contains('First').should('be.visible')
    cy.contains('Second').should('not.be.visible')
    cy.contains('Third').should('not.be.visible')
  })

  it('shows others after clicking chosen option', () => {
    mount()

    cy.contains('First').click()
    cy.contains('Second').should('be.visible')
    cy.contains('Third').should('be.visible')
  })

  it('calls onSelect after clicking option', () => {
    const onSelect = cy.stub()

    mount({ onSelect })

    cy.contains('First').click()
    cy.contains('Second').click().then(() => {
      expect(onSelect).to.be.calledWith({ name: 'Second' })
    })
  })

  it('applies className to container', () => {
    mount({ className: 'custom-class' })

    cy.get('.dropdown').should('have.class', 'custom-class')
  })

  it('renders item as specified by renderItem prop', () => {
    mount({ renderItem: ({ name }) => <span>{name}</span> })

    cy.contains('First').children().should('match', 'span')
    cy.contains('Second').should('match', 'span')
    cy.contains('Third').should('match', 'span')
  })

  it('renders caret if there are items', () => {
    mount()

    cy.get('.dropdown-caret')
  })

  it('does not render caret if there are no items', () => {
    mount({ others: [] })

    cy.get('.dropdown-caret').should('not.exist')
  })

  it('disables if disabled specified and does not render options or caret', () => {
    mount({ disabled: true })

    cy.contains('First').should('have.class', 'disabled').click({ force: true })
    cy.get('.dropdown li').should('not.exist')
    cy.get('.dropdown-caret').should('not.exist')
  })

  it('closes dropdown when clicking outside of it', () => {
    // need to pass in AUT document or else it will use spec iframe document
    cy.document().then((doc) => {
      mount({ document: doc })
    })

    cy.contains('First').click()
    cy.get('body').click()
    cy.contains('Second').should('not.be.visible')
  })
})
