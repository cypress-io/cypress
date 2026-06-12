import $ from 'jquery'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import $animation from '../../../src/dom/animation'

const originalGetAnimations = document.getAnimations

const createAnimation = (initialPlayState: 'paused' | 'running') => {
  const animation = {
    playState: initialPlayState,
    pause: vi.fn(() => {
      animation.playState = 'paused'
    }),
    play: vi.fn(() => {
      animation.playState = 'running'
    }),
  }

  return animation
}

describe('dom/animation', () => {
  beforeEach(() => {
    document.body.innerHTML = ''

    Object.defineProperty(document, 'getAnimations', {
      configurable: true,
      value: originalGetAnimations,
    })
  })

  it('should pause and resume running document animations', () => {
    const runningAnimation = createAnimation('running')
    const pausedAnimation = createAnimation('paused')
    const getAnimations = vi.fn(() => [runningAnimation, pausedAnimation])

    Object.defineProperty(document, 'getAnimations', {
      configurable: true,
      value: getAnimations,
    })

    const body = document.querySelector('body')

    if (!body) {
      throw new Error('Expected document.body to exist.')
    }

    const $body = $(body)

    $animation.addCssAnimationDisabler($body)

    expect(document.querySelector('#__cypress-animation-disabler')).not.toBeNull()
    expect(getAnimations).toHaveBeenCalledOnce()
    expect(runningAnimation.pause).toHaveBeenCalledOnce()
    expect(pausedAnimation.pause).not.toHaveBeenCalled()
    expect(runningAnimation.playState).toBe('paused')
    expect(pausedAnimation.playState).toBe('paused')

    $animation.removeCssAnimationDisabler($body)

    expect(document.querySelector('#__cypress-animation-disabler')).toBeNull()
    expect(runningAnimation.play).toHaveBeenCalledOnce()
    expect(pausedAnimation.play).not.toHaveBeenCalled()
    expect(runningAnimation.playState).toBe('running')
    expect(pausedAnimation.playState).toBe('paused')
  })

  it('should keep animations paused until the final remove call', () => {
    const runningAnimation = createAnimation('running')
    const getAnimations = vi.fn(() => [runningAnimation])

    Object.defineProperty(document, 'getAnimations', {
      configurable: true,
      value: getAnimations,
    })

    const body = document.querySelector('body')

    if (!body) {
      throw new Error('Expected document.body to exist.')
    }

    const $body = $(body)

    $animation.addCssAnimationDisabler($body)
    $animation.addCssAnimationDisabler($body)

    expect(document.querySelectorAll('#__cypress-animation-disabler')).toHaveLength(1)
    expect(getAnimations).toHaveBeenCalledOnce()
    expect(runningAnimation.pause).toHaveBeenCalledOnce()

    $animation.removeCssAnimationDisabler($body)

    expect(document.querySelector('#__cypress-animation-disabler')).not.toBeNull()
    expect(runningAnimation.play).not.toHaveBeenCalled()
    expect(runningAnimation.playState).toBe('paused')

    $animation.removeCssAnimationDisabler($body)

    expect(document.querySelector('#__cypress-animation-disabler')).toBeNull()
    expect(runningAnimation.play).toHaveBeenCalledOnce()
    expect(runningAnimation.playState).toBe('running')
  })

  it('should fall back to css only animation disabling when `getAnimations` is unavailable', () => {
    Object.defineProperty(document, 'getAnimations', {
      configurable: true,
      value: undefined,
    })

    const body = document.querySelector('body')

    if (!body) {
      throw new Error('Expected document.body to exist.')
    }

    const $body = $(body)

    expect(() => {
      $animation.addCssAnimationDisabler($body)
      $animation.removeCssAnimationDisabler($body)
    }).not.toThrow()

    expect(document.querySelector('#__cypress-animation-disabler')).toBeNull()
  })

  it('should resume already paused animations if pausing later animations errors', () => {
    const firstAnimation = createAnimation('running')
    const secondAnimation = createAnimation('running')

    const getAnimations = vi.fn(() => [firstAnimation, secondAnimation])

    secondAnimation.pause.mockImplementation(() => {
      throw new Error('pause failed')
    })

    Object.defineProperty(document, 'getAnimations', {
      configurable: true,
      value: getAnimations,
    })

    const body = document.querySelector('body')

    if (!body) {
      throw new Error('Expected document.body to exist.')
    }

    const $body = $(body)

    expect(() => {
      $animation.addCssAnimationDisabler($body)
    }).toThrow('pause failed')

    expect(firstAnimation.pause).toHaveBeenCalledOnce()
    expect(document.querySelector('#__cypress-animation-disabler')).not.toBeNull()

    $animation.removeCssAnimationDisabler($body)

    expect(firstAnimation.play).toHaveBeenCalledOnce()
    expect(firstAnimation.playState).toBe('running')
    expect(document.querySelector('#__cypress-animation-disabler')).toBeNull()
  })

  it('should remove the disabler even if resuming an animation errors', () => {
    const runningAnimation = createAnimation('running')

    const getAnimations = vi.fn(() => [runningAnimation])

    runningAnimation.play.mockImplementation(() => {
      throw new Error('play failed')
    })

    Object.defineProperty(document, 'getAnimations', {
      configurable: true,
      value: getAnimations,
    })

    const body = document.querySelector('body')

    if (!body) {
      throw new Error('Expected document.body to exist.')
    }

    const $body = $(body)

    $animation.addCssAnimationDisabler($body)

    expect(() => {
      $animation.removeCssAnimationDisabler($body)
    }).toThrow('play failed')

    expect(runningAnimation.play).toHaveBeenCalledOnce()
    expect(document.querySelector('#__cypress-animation-disabler')).toBeNull()
  })
})
