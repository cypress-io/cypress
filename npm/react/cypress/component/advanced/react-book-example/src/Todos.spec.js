/// <reference types="cypress" />
import { mount } from 'cypress-react-unit-test'
import React from 'react'
import Todos from './Todos'
import pretty from 'pretty'
import { stripIndent } from 'common-tags'

it('Todo - should create snapshot', () => {
  cy.viewport(400, 400)
  mount(
    <Todos
      todos={[
        { title: 'item1', description: 'an item' },
        { title: 'item2', description: 'another item' },
      ]}
    />,
  )
  cy.get('[data-testid=item]').should('have.length', 2)
  // disabled snapshot commands for now
  // to speed up bundling
  // let tree = component.toJSON();
  // expect(tree).toMatchSnapshot();

  // entire test area
  cy.get('#cypress-root')
    .invoke('html')
    .then(pretty)
    .should(
      'equal',
      stripIndent`
        <h3 data-testid="item" class="">item1</h3>
        <div>an item</div><button>Select</button>
        <h3 data-testid="item" class="">item2</h3>
        <div>another item</div><button>Select</button>
      `,
    )

  cy.contains('[data-testid=item]', 'item1').should('be.visible')
  // selecting works
  cy.contains('[data-testid=item]', 'item2')
    .next()
    .should('have.text', 'another item')
    .next()
    .should('have.text', 'Select')
    .click()
  cy.contains('[data-testid=item]', 'item2').should('have.class', 'selected')
})
