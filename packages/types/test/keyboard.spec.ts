import { describe, it, expect } from 'vitest'
import { USKeyboard, getUsKeyDefinition } from '../src/keyboard'
import { NamedKeys, SpaceKey } from '../src/automation'

describe('keyboard', () => {
  describe('getUsKeyDefinition', () => {
    it('looks up a key by its name', () => {
      expect(getUsKeyDefinition('Enter')).toEqual({ keyCode: 13, code: 'Enter', key: 'Enter', text: '\r' })
      expect(getUsKeyDefinition('KeyA')).toEqual({ keyCode: 65, code: 'KeyA', shiftKey: 'A', key: 'a' })
    })

    it('looks up a key by the character it types', () => {
      expect(getUsKeyDefinition('a')).toEqual({ keyCode: 65, key: 'a', code: 'KeyA' })
      expect(getUsKeyDefinition('\r')).toMatchObject({ keyCode: 13, code: 'Enter', key: 'Enter', text: '\r' })
      expect(getUsKeyDefinition('\n')).toMatchObject({ keyCode: 13, code: 'Enter', key: 'Enter', text: '\r' })
    })

    it('returns undefined for a character that is not on the US layout', () => {
      expect(getUsKeyDefinition('€')).toBeUndefined()
      expect(getUsKeyDefinition('é')).toBeUndefined()
    })

    it('does not resolve Object.prototype members', () => {
      for (const name of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
        expect(getUsKeyDefinition(name)).toBeUndefined()
      }
    })
  })

  describe('USKeyboard', () => {
    it('defines every named key that cy.press() accepts, with a keyCode and code', () => {
      for (const name of NamedKeys) {
        const definition = getUsKeyDefinition(name)

        expect(definition, name).toBeDefined()
        expect(definition?.keyCode, name).toBeGreaterThan(0)
        expect(definition?.code, name).toBe(name)
      }
    })

    it('types a space for the Space key', () => {
      expect(getUsKeyDefinition(SpaceKey)?.key).toBe(' ')
    })

    it('maps each letter, in either case, to its Key code and keyCode', () => {
      for (let i = 0; i < 26; i++) {
        const lower = String.fromCharCode(97 + i)
        const upper = lower.toUpperCase()
        const expected = { keyCode: 65 + i, code: `Key${upper}` }

        expect(getUsKeyDefinition(lower), lower).toMatchObject({ key: lower, ...expected })
        expect(getUsKeyDefinition(upper), upper).toMatchObject({ key: upper, ...expected })
      }
    })

    it('maps each digit to its Digit code and keyCode', () => {
      for (let i = 0; i <= 9; i++) {
        expect(getUsKeyDefinition(String(i))).toEqual({ keyCode: 48 + i, key: String(i), code: `Digit${i}` })
      }
    })

    it('uses only valid KeyboardEvent.location values', () => {
      for (const [name, definition] of Object.entries(USKeyboard)) {
        if ('location' in definition) {
          expect([0, 1, 2, 3], name).toContain(definition.location)
        }
      }
    })
  })
})
