import React from 'react'
import 'regenerator-runtime'
import { mount } from '../../../npm/react'
import { App } from '../../src/App'

describe('App', () => {
  it('exercises the entire workflow', () => {
    mount(<App />)

    cy.get('button').contains('Pen').click()
    cy.get('button[name="blue"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 20, 20, { eventConstructor: 'MouseEvent' })

    cy.get('#cy-draw__temp--canvas')
      .trigger('mousemove', 20, 20, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 280, 20, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 280, 50, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 20, 50, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 20, 80, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 280, 80, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 280, 80, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    cy.get('button').contains('Rect').click()
    cy.get('button[name="black"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 20, 150, { eventConstructor: 'MouseEvent' })

    cy.get('#cy-draw__temp--canvas')
      .trigger('mousemove', 20, 150, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 280, 280, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    cy.get('button').contains('Circle').click()

    cy.get('button[name="blue"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 80, 200, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 100, 220, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    cy.get('button[name="black"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 150, 200, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 170, 220, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    cy.get('button[name="red"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 220, 200, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 240, 220, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    cy.get('button[name="gold"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 115, 230, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 135, 250, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    cy.get('button[name="green"]').click()
    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 185, 230, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 205, 250, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    // @ts-ignore
    cy.document().toMatchImageSnapshot()
  })

  it('can go back in time and mutate history', () => {
    mount(<App />)

    cy.get('button').contains('Circle').click()

    cy.get('button[name="blue"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 80, 200, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 100, 220, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    cy.get('button[name="black"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 150, 200, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 170, 220, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    cy.get('button[name="red"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 220, 200, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 240, 220, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    cy.get('button[name="gold"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 115, 230, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 135, 250, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    cy.get('button[name="green"]').click()
    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 185, 230, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 205, 250, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    // @ts-ignore
    cy.document().toMatchImageSnapshot()

    cy.get('[role="history"]').find('[role="history-step"]').its('length').should('eq', 5)
    cy.get('[name="step-1"]').click()
    // @ts-ignore
    // cy.document().toMatchImageSnapshot()
    cy.get('[name="step-2"]').click()
    // @ts-ignore
    // cy.document().toMatchImageSnapshot()
    cy.get('[name="step-3"]').click()
    // @ts-ignore
    // cy.document().toMatchImageSnapshot()
    cy.get('[name="step-4"]').click()
    // @ts-ignore
    // cy.document().toMatchImageSnapshot()
    cy.get('[name="step-5"]').click()
    // @ts-ignore
    // cy.document().toMatchImageSnapshot()

    cy.get('[name="step-1"]').click()

    cy.get('button[name="blue"]').click()
    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 220, 200, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 240, 220, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    cy.get('button').contains('Pen').click()
    cy.get('button[name="blue"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 20, 20, { eventConstructor: 'MouseEvent' })

    cy.get('#cy-draw__temp--canvas')
      .trigger('mousemove', 100, 280, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 200, 280, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 200, 280, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })
  })
})