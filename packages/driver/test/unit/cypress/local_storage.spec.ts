/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import $LocalStorage from '../../../src/cypress/local_storage'

describe('src/cypress/local_storage', () => {
  describe('.clear', () => {
    beforeEach(() => {
      localStorage.clear()
      $LocalStorage.setStorages(localStorage, null)
    })

    afterEach(() => {
      $LocalStorage.unsetStorages()
      localStorage.clear()
    })

    it('removes every item except those whose key mentions debug', () => {
      localStorage.setItem('debug', 'cypress:*')
      localStorage.setItem('my-debug-flag', 'true')
      localStorage.setItem('token', 'abc')
      localStorage.setItem('Debug', 'not special')

      $LocalStorage.clear([])

      expect(Object.keys(localStorage).sort()).toEqual(['debug', 'my-debug-flag'])
    })
  })
})
