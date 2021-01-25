import { cyDraw } from '../../src/draw'
import { expect } from 'chai'

// @ts-ignore
const user = cy

interface Point {
  x: number
  y: number
}

const interpolate = (from: Point, to: Point, { speed }: { speed: number }) => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const stepCount = Math.abs(dx > dy ? dx : dy) / speed
  const points: Point[] = []

  const dxInc = dx / stepCount
  const dyInc = dy / stepCount
  let x = from.x
  let y = from.y

  for (let i = 0; i < stepCount + 1; i++) {
    points.push({ x, y })
    x += dxInc
    y += dyInc
  }

  return points
}

describe('cyDraw', () => {
  beforeEach(() => {
    document.body.outerHTML = ''
    const root = document.createElement('div')

    root.id = 'root'
    document.body.append(root)
  })

  it('interpolate', () => {
    const points = interpolate({ x: 0, y: 5 }, { x: 5, y: 15 }, { speed: 1 })
    const expected: Point[] = [
      { x: 0, y: 5 },
      { x: 0.5, y: 6 },
      { x: 1, y: 7 },
      { x: 1.5, y: 8 },
      { x: 2, y: 9 },
      { x: 2.5, y: 10 },
      { x: 3, y: 11 },
      { x: 3.5, y: 12 },
      { x: 4, y: 13 },
      { x: 4.5, y: 14 },
      { x: 5, y: 15 },
    ]

    expect(points).to.eql(expected)
  })

  it('draws a star', () => {
    cyDraw('#root', { height: 300, width: 300 })
    const speed = 5
    const star = [
      ...interpolate({ x: 20, y: 100 }, { x: 280, y: 100 }, { speed }),
      ...interpolate({ x: 280, y: 100 }, { x: 50, y: 220 }, { speed }),
      ...interpolate({ x: 50, y: 220 }, { x: 150, y: 30 }, { speed }),
      ...interpolate({ x: 150, y: 30 }, { x: 250, y: 220 }, { speed }),
      ...interpolate({ x: 250, y: 220 }, { x: 20, y: 100 }, { speed }),
    ]

    let started = false
    for (const point of star) {
      if (!started) {
        user.get('canvas')
          .trigger('mousedown', point.x, point.y, { eventConstructor: 'MouseEvent' })
        started = true
      }

      user.get('canvas')
        .trigger('mousemove', point.x, point.y, { eventConstructor: 'MouseEvent' })
    }

    user.get('canvas').trigger('mouseup', { eventConstructor: 'MouseEvent' })

  })
})
