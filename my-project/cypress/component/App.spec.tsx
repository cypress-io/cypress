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
    cy.get('button[name="green"]').click()

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 20, 150, { eventConstructor: 'MouseEvent' })

    cy.get('#cy-draw__temp--canvas')
      .trigger('mousemove', 20, 150, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 280, 250, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })

    // @ts-ignore
    cy.document().toMatchImageSnapshot()
  })
})