import React from 'react'
import 'regenerator-runtime'
import { mount } from '../../../npm/react'
import { Canvas } from '../../src/Canvas'

describe('Canvas', () => {
  it('draws with the pen tool', () => {
    mount(
      <Canvas
        shape='pen'
        color='black'
      />
    )

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

    // @ts-ignore
    cy.document().toMatchImageSnapshot()
  })

  it('draws with the rect tool', () => {
    mount(
      <Canvas
        shape='rect'
        color='black'
      />
    )

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