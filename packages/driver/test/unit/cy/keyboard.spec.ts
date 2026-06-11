/**
 * @vitest-environment jsdom
 */
import _ from '../../../src/config/lodash'
import '../../../src/config/jquery'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { StateFunc } from '../../../src/cypress/state'
import { Keyboard } from '../../../src/cy/keyboard'
import $dom from '../../../src/dom'
import $elements from '../../../src/dom/elements'

const createState = (): StateFunc => {
  const values: Record<string, any> = {}

  const state = ((key?: string | Record<string, any>, value?: any) => {
    if (typeof key === 'undefined') {
      return values
    }

    if (typeof key === 'object') {
      Object.assign(values, key)

      return values
    }

    if (arguments.length === 2) {
      values[key] = value
    }

    return values[key]
  }) as StateFunc

  return state
}

describe('src/cy/keyboard', () => {
  beforeEach(() => {
    // @ts-expect-error - patched jquery references global _
    global._ = _

    // @ts-expect-error - partial Cypress mock for unit tests
    global.Cypress = {
      isBrowser: vi.fn(() => false),
    }
  })

  it('defers keyup to the next tick in typeSimulatedKey (#14864)', async () => {
    const keyboard = new Keyboard(createState())
    const input = document.createElement('input')

    document.body.append(input)

    let keyupFired = false

    vi.spyOn($elements, 'isFocusable').mockReturnValue(true)
    vi.spyOn($elements, 'isTextLike').mockReturnValue(true)
    vi.spyOn(keyboard, 'getActiveEl').mockReturnValue(input)
    vi.spyOn(keyboard, 'simulatedKeyup').mockImplementation(() => {
      keyupFired = true
    })

    vi.spyOn(keyboard, 'simulatedKeydown').mockImplementation(() => {})

    const key = {
      type: 'key' as const,
      key: '/',
      text: '/',
      code: 'Slash',
      keyCode: 191,
      location: 0,
      events: {
        keydown: true,
        keypress: true,
        input: true,
        keyup: true,
      },
    }

    const promise = keyboard.typeSimulatedKey(input, key, {
      $el: $dom.wrap(input),
      force: true,
    })

    expect(keyupFired).toBe(false)

    await promise

    expect(keyupFired).toBe(true)
  })
})
