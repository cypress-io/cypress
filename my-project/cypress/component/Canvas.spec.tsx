import React, { useRef } from 'react'
import 'regenerator-runtime'
import { mount } from '../../../npm/react'
import { Canvas } from '../../src/Canvas'
import { Shape } from '../../src/Toolbar'

const CanvasWithShape = ({ shape, onFinishDrawingShape }: { shape: Shape, onFinishDrawingShape: typeof cy.stub }) => {
  const CanvasWrapper: React.FC = () => {
    const ref = useRef(null)
    return (
      <Canvas
        canvasRef={ref}
        onFinishDrawingShape={onFinishDrawingShape}
        shape={shape}
        color='black'
      />
    )
  }
  return <CanvasWrapper />
}

describe('Canvas', () => {
  it('draws with the pen tool', () => {
    const onFinishDrawingShape = cy.stub()
    mount(CanvasWithShape({ shape: 'pen', onFinishDrawingShape }))

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 20, 20, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 20, 20, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 280, 20, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 280, 50, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 20, 50, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 20, 80, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 280, 80, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 280, 80, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })
      .then(() => {
        expect(onFinishDrawingShape).to.have.been.calledOnce
      })
    
    // @ts-ignore
    cy.document().toMatchImageSnapshot()
  })

  it('draws with the rect tool', () => {
    const onFinishDrawingShape = cy.stub()
    mount(CanvasWithShape({ shape: 'rect', onFinishDrawingShape }))

    cy.get('#cy-draw__main--canvas')
      .trigger('mousedown', 20, 150, { eventConstructor: 'MouseEvent' })
      .get('#cy-draw__temp--canvas')
      .trigger('mousemove', 20, 150, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', 280, 250, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' })
      .then(() => {
        expect(onFinishDrawingShape).to.have.been.calledOnce
      })

    // @ts-ignore
    cy.document().toMatchImageSnapshot()
  })

  it('draws with the circle tool', () => {
    const onFinishDrawingShape = cy.stub()
    mount(CanvasWithShape({ shape: 'circle', onFinishDrawingShape }))

    const drawCircles = (x: number, y: number) => {
      return cy.get('#cy-draw__main--canvas')
        .trigger('mousedown', 150, 150, { eventConstructor: 'MouseEvent' })
        .get('#cy-draw__temp--canvas')
        .trigger('mousemove', x, y, { eventConstructor: 'MouseEvent' })
        .trigger('mouseup', { eventConstructor: 'MouseEvent' })
    }

    drawCircles(120, 120)
    drawCircles(100, 100)
    drawCircles(80, 80)
    drawCircles(60, 60)
    drawCircles(40, 40)
      .then(() => {
        expect(onFinishDrawingShape.callCount).to.eq(5)
      })

    // @ts-ignore
    cy.document().toMatchImageSnapshot()
  })
})