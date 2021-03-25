/// <reference types="@percy/cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import RunnerCt from '../../src/app/RunnerCt'
import State from '../../src/lib/state'
import '@packages/runner/src/main.scss'
import eventManager from '../../src/lib/event-manager'
import { testSpecFile } from '../fixtures/testSpecFile'

const fakeConfig = { projectName: 'Project', env: {}, isTextTerminal: false } as any as Cypress.RuntimeConfigOptions
const makeState = (options = {}) => (new State({
  reporterWidth: 500,
  spec: null,
  specs: [{ relative: '/test.js', absolute: 'root/test.js', name: 'test.js' }],
  ...options,
}, fakeConfig))

describe('RunnerCt', () => {
  beforeEach(() => {
    cy.viewport(1000, 500)
  })

  it('resizes reporter', () => {
    cy.intercept('GET', 'http://localhost:60728/undefined/iframes//test.js', {
      statusCode: 200,
      body: testSpecFile,
    })

    mount(
      <RunnerCt
        state={makeState()}
        eventManager={eventManager}
        // @ts-ignore - TODO: define a good test config.
        config={fakeConfig}
      />,
    )

    // select spec.
    cy.get('[data-item="/test.js"').click()

    cy.get('.size-container').then(($el) => {
      const style = $el.attr('style')
      // extract inline transform value.
      const [, initialScale] = style.match(/transform.\s(.+);/)

      // resize reporter
      cy.get('.Resizer.vertical').eq(2)
      .trigger('mousedown', { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', -200, -200, { eventConstructor: 'MouseEvent', force: true })
      .trigger('mouseup')

      // AUT scale should be different.
      cy.get('.size-container').then(($el) => {
        const newStyle = $el.attr('style')
        const [, newScale] = newStyle.match(/transform.\s(.+);/)

        expect(newScale).not.to.eq(initialScale)
      })
    })

    cy.percySnapshot()
  })
})
