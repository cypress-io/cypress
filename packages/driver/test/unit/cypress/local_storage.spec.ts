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
      localStorage.setItem('app:debugMode', 'true')
      localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOGYzYTJjNzEiLCJlbWFpbCI6ImphbmUuZG9lQGV4YW1wbGUuY29tIiwiaWF0IjoxNzYzNjgzMjAwfQ.JaVsgIApSBU0bEGfl0rHAJoU2ao8VW3nks_QEma_Y50')
      localStorage.setItem('DEBUG', 'express:*')

      $LocalStorage.clear([])

      expect(Object.keys(localStorage).sort()).toEqual(['app:debugMode', 'debug'])
    })
  })
})
