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
import $selection from '../../../src/dom/selection'

const createState = (): StateFunc => {
  const values: Record<string, any> = {}

  const state = ((...args: [key?: string | Record<string, any>, value?: any]) => {
    const [key, value] = args

    if (typeof key === 'undefined') {
      return values
    }

    if (typeof key === 'object') {
      Object.assign(values, key)

      return values
    }

    if (args.length === 2) {
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

  describe('type', () => {
    // Records each key that would be typed, and runs the default action that
    // sets a date-like input's value, without dispatching events, which jsdom
    // cannot do for the driver
    const typeInto = async (type: string, chars: string) => {
      const keyboard = new Keyboard(createState())
      const input = document.createElement('input')
      const typed: string[] = []

      input.setAttribute('type', type)
      document.body.append(input)

      vi.spyOn($elements, 'isFocusable').mockReturnValue(true)
      vi.spyOn($dom, 'isTextLike').mockReturnValue(true)
      vi.spyOn(keyboard, 'getActiveEl').mockReturnValue(input)
      vi.spyOn(keyboard, 'typeSimulatedKey').mockImplementation(async (el, key) => {
        typed.push(key.key)
        key.simulatedDefault?.(el, key, {} as any)
      })

      await keyboard.type({ $el: $dom.wrap(input), chars, force: true, onFail: _.noop } as any)

      return { typed, value: input.value }
    }

    describe('special character sequences', () => {
      it.each([
        ['a{enter}b', ['a', 'Enter', 'b']],
        ['{enter}{enter}', ['Enter', 'Enter']],
        ['{backspace}x{del}', ['Backspace', 'x', 'Delete']],
        ['x{{}y', ['x', '{', 'y']],
        ['a{}b', ['a', '{', '}', 'b']],
        ['}{', ['}', '{']],
      ])('splits %j into its keys', async (chars, keys) => {
        expect((await typeInto('text', chars)).typed).toEqual(keys)
      })
    })

    describe('time inputs', () => {
      it.each([
        '00:00',
        '09:05',
        '19:59',
        '23:59',
        '12:30:45',
        '12:30:45.1',
        '12:30:45.123',
      ])('sets the value to %j', async (chars) => {
        expect((await typeInto('time', chars)).value).toBe(chars)
      })

      it.each([
        '24:00',
        '25:00',
        '12:60',
        '1:30',
        '12:30:60',
        '12:30:45.1234',
        '12-30',
        '112:30',
      ])('rejects %j', async (chars) => {
        await expect(typeInto('time', chars)).rejects.toThrow('requires a valid time')
      })
    })

    describe('datetime-local inputs', () => {
      it.each([
        '2020-01-02T03:04',
        '2020-01-02T03:04:05',
        '2020-01-02T03:04:05.678',
      ])('sets the value to %j', async (chars) => {
        // jsdom normalizes the value, as in `2020-01-02T03:04:05.000`
        expect((await typeInto('datetime-local', chars)).value).toContain(chars)
      })

      it.each([
        '2020-1-02T03:04',
        '20201-01-02T03:04',
        '2020-01-02 03:04',
        '2020-01-02T03',
        '2020-01-02T03:04:05.6789',
      ])('rejects %j', async (chars) => {
        await expect(typeInto('datetime-local', chars)).rejects.toThrow('requires a valid datetime')
      })
    })
  })

  describe('getSimulatedDefaultForKey on a number input', () => {
    // Types one character into a number input that holds `value`, after the
    // characters held back in `prevValue`, and reports what was inserted and
    // what is still held back
    const typeNumberChar = (value: string, char: string, prevValue?: string) => {
      const keyboard = new Keyboard(createState())
      const input = document.createElement('input')
      // Safe because a number input's default action only reads prevValue and force
      const options = { prevValue } as any
      const key = { key: char, text: char, events: { input: true } } as any
      const replaceSelectionContents = vi.spyOn($selection, 'replaceSelectionContents').mockImplementation(() => {})

      input.setAttribute('type', 'number')
      document.body.append(input)
      input.value = value

      keyboard.getSimulatedDefaultForKey(key, options)(input, key, options)

      return {
        inserted: replaceSelectionContents.mock.calls[0]?.[1],
        heldBack: options.prevValue,
      }
    }

    it.each([
      ['', '1', undefined, '1'],
      ['1', '2', undefined, '2'],
      ['1', '5', 'e', 'e5'],
      ['1', '5', 'E', 'E5'],
      ['1', '5', 'e-', 'e-5'],
      ['1', '5', 'e+', 'e+5'],
      ['1', '5', '.', '.5'],
      ['', '5', '.', '.5'],
      ['', '5', '-', '-5'],
      ['', '5', '-.', '-.5'],
    ])('inserts the number that %j becomes after %j held back as %j', (value, char, prevValue, inserted) => {
      expect(typeNumberChar(value, char, prevValue)).toEqual({ inserted, heldBack: undefined })
    })

    it.each([
      ['1', 'e'],
      ['1', 'E'],
      ['1', '.'],
      ['', '-'],
      ['1', '+'],
    ])('holds back %j + %j until the number is complete', (value, char) => {
      expect(typeNumberChar(value, char)).toEqual({ inserted: undefined, heldBack: char })
    })

    it.each([
      ['1', 'a'],
      ['1', ' '],
      ['1', ','],
      ['1', 'x'],
    ])('drops a character that can never be part of a number from %j + %j', (value, char) => {
      expect(typeNumberChar(value, char)).toEqual({ inserted: undefined, heldBack: undefined })
    })

    it.each([
      ['1', '5', 'e5e'],
      ['1', '5', '..'],
    ])('holds back %j + %j after %j because it is still not a number', (value, char, prevValue) => {
      expect(typeNumberChar(value, char, prevValue)).toEqual({ inserted: undefined, heldBack: `${prevValue}${char}` })
    })
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

  it('resolves modifier keyup target after main shortcut keyup', async () => {
    const keyboard = new Keyboard(createState())
    const input = document.createElement('input')
    const modifierTarget = document.createElement('input')

    document.body.append(input, modifierTarget)

    const shortcut = {
      type: 'shortcut' as const,
      originalSequence: '{meta+a}',
      key: {
        type: 'key' as const,
        key: 'a',
        text: 'a',
        code: 'KeyA',
        keyCode: 65,
        location: 0,
        events: {
          keydown: true,
          keypress: true,
          input: true,
          keyup: true,
        },
      },
      modifiers: [{
        type: 'key' as const,
        key: 'Meta',
        text: 'Meta',
        code: 'MetaLeft',
        keyCode: 91,
        location: 0,
        events: {
          keydown: true,
          keypress: false,
          input: false,
          keyup: true,
        },
      }],
    }

    const callOrder: string[] = []

    vi.spyOn(keyboard, 'getActiveEl').mockImplementation(() => {
      callOrder.push('getActiveEl')

      return modifierTarget
    })

    vi.spyOn(keyboard, 'simulatedKeyup').mockImplementation((_el, key) => {
      callOrder.push(key === shortcut.key ? 'mainKeyup' : 'modifierKeyup')
    })

    vi.spyOn(keyboard, 'simulatedKeydown').mockImplementation(() => {})

    await keyboard.simulateShortcut(input, shortcut, {
      $el: $dom.wrap(input),
      force: true,
    })

    expect(callOrder).toEqual(['mainKeyup', 'getActiveEl', 'modifierKeyup'])
  })
})
