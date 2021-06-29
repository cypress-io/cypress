import { SwipeDirection, useSwipe } from './index'
import { useSetup } from '../../.test'

import each from 'jest-each'

describe('useSwipe', () => {
  const target = document.createElement('div')
  target.id = 'target'
  document.body.appendChild(target)

  const mockTouchEventInit = (x: number, y: number): TouchEventInit => ({
    touches: [{
      clientX: x,
      clientY: y,
      altitudeAngle: 0,
      azimuthAngle: 0,
      force: 0,
      identifier: 0,
      pageX: 0,
      pageY: 0,
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      screenX: 0,
      screenY: 0,
      target,
      touchType: 'direct',
    }],
  })

  const mockTouchStart = (x: number, y: number) => new TouchEvent('touchstart', mockTouchEventInit(x, y))
  const mockTouchMove = (x: number, y: number) => new TouchEvent('touchmove', mockTouchEventInit(x, y))
  const mockTouchEnd = (x: number, y: number) => new TouchEvent('touchend', mockTouchEventInit(x, y))

  const mockTouchEvents = (target: EventTarget, coords: Array<number[]>) => {
    coords.forEach(([x, y], i) => {
      if (i === 0)
        target.dispatchEvent(mockTouchStart(x, y))
      else if (i === coords.length - 1)
        target.dispatchEvent(mockTouchEnd(x, y))
      else
        target.dispatchEvent(mockTouchMove(x, y))
    })
  }

  let onSwipe: jest.Mock
  let onSwipeEnd: jest.Mock
  const threshold = 30

  beforeEach(() => {
    onSwipe = jest.fn((e: TouchEvent) => {})
    onSwipeEnd = jest.fn((e: TouchEvent, direction: SwipeDirection) => {})
  })

  it('threshold not exceeded', () => {
    useSetup(() => {
      useSwipe(target, { threshold, onSwipe, onSwipeEnd })

      mockTouchEvents(target, [[0, 0], [threshold - 1, 0], [threshold - 1, 0]])

      expect(onSwipe.mock.calls.length).toBe(0)
      expect(onSwipeEnd.mock.calls.length).toBe(0)
    })
  })

  it('threshold exceeded', () => {
    useSetup(() => {
      useSwipe(target, { threshold, onSwipe, onSwipeEnd })

      mockTouchEvents(target, [[0, 0], [threshold / 2, 0], [threshold, 0], [threshold, 0]])

      expect(onSwipe.mock.calls.length).toBe(1)
      expect(onSwipeEnd.mock.calls.length).toBe(1)
    })
  })

  it('threshold exceeded in between', () => {
    useSetup(() => {
      useSwipe(target, { threshold, onSwipe, onSwipeEnd })

      mockTouchEvents(target, [[0, 0], [threshold / 2, 0], [threshold, 0], [threshold - 1, 0], [threshold - 1, 0]])

      expect(onSwipe.mock.calls.length).toBe(2)
      expect(onSwipeEnd.mock.calls.length).toBe(1)
      expect(onSwipeEnd.mock.calls[0][1]).toBe(SwipeDirection.NONE)
    })
  })

  it('reactivity', () => {
    useSetup(() => {
      const { isSwiping, direction, lengthX, lengthY } = useSwipe(target, { threshold, onSwipe, onSwipeEnd })

      target.dispatchEvent(mockTouchStart(0, 0))
      expect(isSwiping.value).toBeFalsy()
      expect(direction.value).toBe(SwipeDirection.NONE)
      expect(lengthX.value).toBe(0)
      expect(lengthY.value).toBe(0)

      target.dispatchEvent(mockTouchMove(threshold, 5))
      expect(isSwiping.value).toBeTruthy()
      expect(direction.value).toBe(SwipeDirection.RIGHT)
      expect(lengthX.value).toBe(-threshold)
      expect(lengthY.value).toBe(-5)

      target.dispatchEvent(mockTouchEnd(threshold, 5))
    })
  })

  each([
    [SwipeDirection.UP, [[0, 2 * threshold], [0, threshold], [0, threshold]]],
    [SwipeDirection.DOWN, [[0, 0], [0, threshold], [0, threshold]]],
    [SwipeDirection.LEFT, [[2 * threshold, 0], [threshold, 0], [threshold, 0]]],
    [SwipeDirection.RIGHT, [[0, 0], [threshold, 0], [threshold, 0]]],
  ]).it('swipe %s', (expected, coords) => {
    useSetup(() => {
      const { direction } = useSwipe(target, { threshold, onSwipe, onSwipeEnd })

      mockTouchEvents(target, coords)

      expect(direction.value).toBe(expected)
      expect(onSwipeEnd.mock.calls[0][1]).toBe(expected)
    })
  })
})
