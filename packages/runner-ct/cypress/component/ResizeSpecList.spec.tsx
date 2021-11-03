/// <reference types="@percy/cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import RunnerCt from '../../src/app/RunnerCt'
import '@packages/runner/src/main.scss'
import { testSpecFile } from '../fixtures/testSpecFile'
import { makeState, fakeConfig, getPort, createEventManager } from './utils'

/**
 * Specs using a real `eventManager` need to be
 * one-per-file or strange things happen.
 * TODO: Figure out why this is the case and remove this
 * limitation
 */

describe('RunnerCt', () => {
  beforeEach(() => {
    cy.viewport(1000, 500)
  })

  it('resizes spec list', () => {
    const port = getPort(location.href)

    cy.intercept('GET', `http://localhost:${port}/undefined/iframes//test.js`, {
      statusCode: 200,
      body: testSpecFile,
    })

    const eventManager = createEventManager()

    mount(
      <RunnerCt
        state={makeState()}
        eventManager={eventManager}
        config={fakeConfig}
      />,
    )

    // select spec.
    cy.get('[title="/test.js"]').click()

    cy.get('.size-container').then(($el) => {
      const style = $el.attr('style')
      // extract inline transform value.
      const [, initialScale] = style.match(/transform.\s(.+);/)

      // resize reporter
      cy.get('.Resizer.vertical').eq(1)
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
