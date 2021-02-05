/// <reference types="cypress-real-events" />
import React from 'react'
import { mount } from '@cypress/react'
import { SpecList } from '../../../src/SpecList'
import { SpecFile } from '../../../src/SpecList/make-spec-hierarchy'
import { SpecFileItem } from '../../../src/SpecList/SpecFileItem'

const createSpec = (name: string): Cypress.Cypress['spec'] => ({
  absolute: `/root/cypress/component/${name}`,
  relative: `component/${name}`,
  name,
})

const spec: SpecFile = {
  ...createSpec('foo-bar.js'),
  name: 'foo-bar.js',
  shortName: 'foo-bar.js',
  type: 'file',
}

const specs: Cypress.Cypress['spec'][] = [
  createSpec('index.spec.js'),
  createSpec('shared/bar.js'),
  createSpec('shared/runner.js'),
  createSpec('shared/spec-list.js'),
  createSpec('component/shared/utils/transform.js'),
]

describe('SpecList', () => {
  it('selected and non selected spec', () => {
    const selectStub = cy.stub()
    const unselectedSpec = { ...spec, shortName: 'unselected.spec.js' }

    mount(
      <ul style={{ position: 'relative' }}>
        <SpecFileItem
          spec={{ ...spec, shortName: 'selected.spec.js' }}
          selected={true}
          onSelectSpec={selectStub}
        />
        <SpecFileItem
          spec={unselectedSpec}
          selected={false}
          onSelectSpec={selectStub}
        />
      </ul>,
    )

    cy.get('[aria-checked=true]')
    .contains('selected.spec.js')

    cy.get('[aria-checked=false]')
    .contains('unselected.spec.js')
    .click()
    .then(() => {
      expect(selectStub).to.have.been.calledWith(unselectedSpec)
    })
  })

  it('renders an empty list', () => {
    mount(
      <SpecList
        specs={specs}
        selectedSpecs={[]}
        onSelectSpec={() => {}}
      />,
    )
  })

  it('opens and closes folders', () => {
    mount(
      <SpecList
        specs={specs}
        selectedSpecs={['component/shared/utils/transform.js']}
        onSelectSpec={cy.stub()}
      />,
    );

    ['bar.js', 'runner.js', 'spec-list.js'].forEach((spec) => {
      cy.get('[role=radio]').contains(spec).should('exist')
    })

    cy.get('[role=radio]').contains('transform.js')
    cy.get('a').contains('shared').click();

    ['bar.js', 'runner.js', 'spec-list.js'].forEach((spec) => {
      cy.get('[role=radio]').contains(spec).should('not.exist')
    })
  })

  it('filters the specs', () => {
    mount(
      <SpecList
        specs={specs}
        selectedSpecs={[]}
        onSelectSpec={cy.stub()}
      />,
    )

    cy.get('[placeholder="Find spec..."]').type('transform.js')
    cy.get('[role=radio]').contains('transform.js').should('exist');

    ['bar.js', 'runner.js', 'spec-list.js'].forEach((spec) => {
      cy.get('[role=radio]').contains(spec).should('not.exist')
    })
  })

  it('selects a spec to run', () => {
    const onSelectSpecStub = cy.stub()

    mount(
      <SpecList
        specs={specs}
        selectedSpecs={[]}
        onSelectSpec={onSelectSpecStub}
      />,
    )

    cy.get('[role=radio]')
    .contains('transform.js')
    .click()
    .then(() => {
      expect(onSelectSpecStub).to.have.been.calledOnce
    })
  })

  it('selects a spec to run only with keyboard', () => {
    const onSelectSpecStub = cy.stub()

    mount(
      <SpecList
        specs={specs}
        selectedSpecs={[]}
        onSelectSpec={onSelectSpecStub}
      />,
    )

    cy.window().then((win) => win.focus())

    cy.realPress('/')
    cy.get('input[placeholder="Find spec..."]').should('be.focused')

    cy.realPress('ArrowDown')
    cy.realPress('ArrowDown')
    cy.realPress('ArrowUp')
    cy.realPress('ArrowDown')
    cy.realPress('{enter}').then(() => {
      expect(onSelectSpecStub).to.have.been.calledOnce
      expect(onSelectSpecStub.args[0][0].name).to.eq('shared/bar.js')
    })
  })

  context('a11y navigation', () => {
    beforeEach(() => {
      mount(
        <SpecList
          specs={specs}
          selectedSpecs={[]}
          onSelectSpec={() => {}}
        />,
      )

      cy.get('input[placeholder="Find spec..."]').click()
    })

    it('ArrowUp initially focuses the first field', () => {
      cy.realPress('ArrowUp')

      cy.get('[role=radio]')
      .contains('index.spec.js')
      .parent()
      .should('be.focused')
    })

    it('ArrowUp moves focus to previous spec', () => {
      cy.contains('runner.js').parent().focus().should('be.focused')
      cy.realPress('ArrowUp')

      cy.get('[role=radio]')
      .contains('bar.js')
      .parent()
      .should('be.focused')
    })

    it('ArrowDown', () => {
      cy.contains('runner.js').parent().focus().should('be.focused')
      cy.realPress('ArrowDown')

      cy.get('[role=radio]')
      .contains('spec-list.js')
      .parent()
      .should('be.focused')
    })
  })
})
