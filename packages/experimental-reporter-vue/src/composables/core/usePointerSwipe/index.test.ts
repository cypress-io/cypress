import { PointerSwipeOptions, usePointerSwipe } from './index'

import { useSetup } from '../../.test'
import { SwipeDirection } from '../useSwipe'

import each from 'jest-each'

// polyfill for jsdom (https://github.com/jsdom/jsdom/pull/2666)
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    public pointerId?: number

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId
    }
  }
  global.PointerEvent = PointerEvent as any
}

const mockPointerEventInit = (x: number, y: number): PointerEventInit => ({
  clientX: x,
  clientY: y,
})

const mockPointerDown = (x: number, y: number) => new PointerEvent('pointerdown', mockPointerEventInit(x, y))
const mockPointerMove = (x: number, y: number) => new PointerEvent('pointermove', mockPointerEventInit(x, y))
const mockPointerUp = (x: number, y: number) => new PointerEvent('pointerup', mockPointerEventInit(x, y))

const mockPointerEvents = (target: Element, coords: Array<number[]>) => {
  coords.forEach(([x, y], i) => {
    if (i === 0)
      target.dispatchEvent(mockPointerDown(x, y))
    else if (i === coords.length - 1)
      target.dispatchEvent(mockPointerUp(x, y))
    else
      target.dispatchEvent(mockPointerMove(x, y))
  })
}

describe('usePointerSwipe', () => {
  const target = document.createElement('div')
  target.id = 'target'
  // set to noop, else test will fail
  target.setPointerCapture = (pointerId: number) => {}
  document.body.appendChild(target)

  const threshold = 30
  let onSwipeStart: jest.Mock
  let onSwipe: jest.Mock
  let onSwipeEnd: jest.Mock

  const options = (): PointerSwipeOptions => ({
    threshold,
    onSwipeStart,
    onSwipe,
    onSwipeEnd,
  })

  beforeEach(() => {
    onSwipeStart = jest.fn((e: PointerEvent) => {})
    onSwipe = jest.fn((e: PointerEvent) => {})
    onSwipeEnd = jest.fn((e: PointerEvent, direction: SwipeDirection) => {})
  })

  it('threshold is not exceeded', () => {
    useSetup(() => {
      usePointerSwipe(target, options())

      mockPointerEvents(target, [[0, 0], [threshold - 1, 0], [threshold - 1, 0]])

      expect(onSwipeStart.mock.calls.length).toBe(1)
      expect(onSwipe.mock.calls.length).toBe(0)
      expect(onSwipeEnd.mock.calls.length).toBe(0)
    })
  })

  it('threshold is exceeded', () => {
    useSetup(() => {
      usePointerSwipe(target, options())

      mockPointerEvents(target, [[0, 0], [threshold / 2, 0], [threshold, 0], [threshold, 0]])

      expect(onSwipeStart.mock.calls.length).toBe(1)
      expect(onSwipe.mock.calls.length).toBe(1)
      expect(onSwipeEnd.mock.calls.length).toBe(1)
      expect(onSwipeEnd.mock.calls[0][1]).toBe(SwipeDirection.RIGHT)
    })
  })

  it('threshold is exceeded in between', () => {
    useSetup(() => {
      usePointerSwipe(target, options())

      mockPointerEvents(target, [[0, 0], [threshold / 2, 0], [threshold, 0], [threshold - 1, 0], [threshold - 1, 0]])

      expect(onSwipeStart.mock.calls.length).toBe(1)
      expect(onSwipe.mock.calls.length).toBe(2)
      expect(onSwipeEnd.mock.calls.length).toBe(1)
      expect(onSwipeEnd.mock.calls[0][1]).toBe(SwipeDirection.NONE)
    })
  })

  it('reactivity', () => {
    useSetup(() => {
      const { isSwiping, direction, distanceX, distanceY } = usePointerSwipe(target, options())

      target.dispatchEvent(mockPointerDown(0, 0))
      expect(isSwiping.value).toBeFalsy()
      expect(direction.value).toBe(SwipeDirection.NONE)
      expect(distanceX.value).toBe(0)
      expect(distanceY.value).toBe(0)

      target.dispatchEvent(mockPointerMove(threshold, threshold / 2))
      expect(isSwiping.value).toBeTruthy()
      expect(direction.value).toBe(SwipeDirection.RIGHT)
      expect(distanceX.value).toBe(-threshold)
      expect(distanceY.value).toBe(-threshold / 2)

      target.dispatchEvent(mockPointerUp(threshold, threshold / 2))
    })
  })

  each([
    [SwipeDirection.UP, [[0, 2 * threshold], [0, threshold], [0, threshold]]],
    [SwipeDirection.DOWN, [[0, 0], [0, threshold], [0, threshold]]],
    [SwipeDirection.LEFT, [[2 * threshold, 0], [threshold, 0], [threshold, 0]]],
    [SwipeDirection.RIGHT, [[0, 0], [threshold, 0], [threshold, 0]]],
  ]).it('detect swipe to %s', (expected, coords) => {
    useSetup(() => {
      const { direction } = usePointerSwipe(target, options())

      mockPointerEvents(target, coords)

      expect(direction.value).toBe(expected)
      expect(onSwipeEnd.mock.calls[0][1]).toBe(expected)
    })
  })
})
