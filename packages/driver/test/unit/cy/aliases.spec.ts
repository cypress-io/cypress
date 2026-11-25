/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import type { $Cy } from '../../../src/cypress/cy'
import { aliasDisplayName, aliasIndexRe, create } from '../../../src/cy/aliases'

describe('src/cy/aliases', () => {
  describe('aliasIndexRe', () => {
    it.each([
      ['@getUsers.all', 'all'],
      ['@getUsers.1', '1'],
      ['@getUsers.12', '12'],
      ['@get.users.3', '3'],
    ])('reads the index from %s', (selector, index) => {
      expect(selector.match(aliasIndexRe)?.[1]).toBe(index)
    })

    it.each([
      '@getUsers',
      '@getUsers.',
      '@getUsers.1a',
      '@getUsers.alls',
      '@getUsers.-1',
      '@getUsers.all.extra',
    ])('reads no index from %s', (selector) => {
      expect(selector.match(aliasIndexRe)).toBeNull()
    })
  })

  describe('aliasDisplayName', () => {
    it.each([
      ['@getUsers', 'getUsers'],
      ['@@getUsers', 'getUsers'],
      ['getUsers', 'getUsers'],
      ['user@example.com', 'user@example.com'],
      ['@user@example.com', 'user@example.com'],
    ])('turns %s into %s', (name, displayName) => {
      expect(aliasDisplayName(name)).toBe(displayName)
    })
  })

  describe('validateAlias', () => {
    // Safe because validateAlias does not read from cy
    const aliases = create({} as $Cy)

    it('rejects an alias that starts with @ and suggests the name without them', () => {
      expect(() => aliases.validateAlias('@@getUsers')).toThrow('Try renaming the alias to `getUsers`,')
    })

    it('accepts an alias that contains @ after its first character', () => {
      expect(() => aliases.validateAlias('user@example.com')).not.toThrow()
    })
  })
})
