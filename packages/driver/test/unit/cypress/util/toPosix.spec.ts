/**
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect, beforeEach, MockedFunction } from 'vitest'

import { toPosix } from '../../../../src/cypress/util/to_posix'

describe('toPosix', () => {
  let config: MockedFunction<any>

  beforeEach(() => {
    config = vi.fn()

    // @ts-expect-error
    global.Cypress = {
      config,
    }
  })

  describe('on windows', () => {
    beforeEach(() => {
      config.mockReturnValue('win32')
    })

    it('replaces backslashes with forward slashes', () => {
      expect(toPosix('C:\\some\\file')).toEqual('C:/some/file')
    })
  })

  describe(`on other OS'`, () => {
    beforeEach(() => {
      config.mockReturnValue('darwin64')
    })

    it('performs as an identity function', () => {
      expect(toPosix('/some/file')).toEqual('/some/file')
    })
  })
})
