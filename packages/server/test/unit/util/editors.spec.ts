import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import * as shellUtil from '../../../lib/util/shell'
import * as envEditors from '../../../lib/util/env-editors'
import * as savedState from '../../../lib/saved_state'

import { getUserEditor, setUserEditor } from '../../../lib/util/editors'

const setPlatform = (platform: string) => {
  Object.defineProperty(process, 'platform', {
    value: platform,
  })
}

describe('lib/util/editors', () => {
  let stateMock: {
    get: ReturnType<typeof vi.fn>
    set: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    stateMock = {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn(),
    }

    vi.spyOn(savedState, 'create').mockResolvedValue(stateMock as never)
  })

  describe('#getUserEditor', () => {
    let platform: string

    beforeEach(() => {
      vi.spyOn(envEditors, 'getEnvEditors').mockReturnValue([{
        id: 'sublimetext',
        binary: 'subl',
        name: 'Sublime Text',
      }, {
        id: 'code',
        binary: 'code',
        name: 'Visual Studio Code',
      }, {
        id: 'vim',
        binary: 'vim',
        name: 'Vim',
      }])

      vi.spyOn(shellUtil, 'commandExists').mockImplementation((command) => {
        const exists = ['code', 'subl', 'vim'].includes(command)

        return Promise.resolve(exists)
      })

      platform = process.platform
      setPlatform('darwin')
    })

    afterEach(() => {
      setPlatform(platform)
      vi.restoreAllMocks()
    })

    it('includes user-set path for "Other" option if available', () => {
      vi.spyOn(savedState, 'create').mockResolvedValue({
        get () {
          return Promise.resolve({ isOther: true, binary: '/path/to/editor', id: 'other' })
        },
      } as never)
    })

    it('computer option is Finder on MacOS', () => {
      return getUserEditor().then(({ availableEditors }) => {
        expect(availableEditors[0].name).toBe('Finder')
      })
    })

    it('computer option is File System on Linux', () => {
      setPlatform('linux')

      return getUserEditor().then(({ availableEditors }) => {
        expect(availableEditors[0].name).toBe('File System')
      })
    })

    it('computer option is File Explorer on Windows', () => {
      setPlatform('win32')

      return getUserEditor().then(({ availableEditors }) => {
        expect(availableEditors[0].name).toBe('File Explorer')
      })
    })

    it('computer option defaults to File System', () => {
      setPlatform('unknown')

      return getUserEditor().then(({ availableEditors }) => {
        expect(availableEditors[0].name).toBe('File System')
      })
    })

    describe('when alwaysIncludeEditors is true', () => {
      it('returns editors along with preferred opener', () => {
        const preferredOpener = {}

        vi.spyOn(savedState, 'create').mockResolvedValue({
          get () {
            return Promise.resolve({ preferredOpener })
          },
        } as never)

        return getUserEditor(true).then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).toHaveLength(4)
          expect(preferredOpener).toBe(preferredOpener)
        })
      })
    })

    describe('when alwaysIncludeEditors is false', () => {
      it('only returns preferred opener if one has been saved', () => {
        const preferredOpener = {}

        vi.spyOn(savedState, 'create').mockResolvedValue({
          get () {
            return Promise.resolve({ preferredOpener })
          },
        } as never)

        return getUserEditor(false).then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).toHaveLength(0)
          expect(preferredOpener).toBe(preferredOpener)
        })
      })

      it('returns available editors if preferred opener has not been saved', () => {
        return getUserEditor(false).then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).toHaveLength(4)
          expect(preferredOpener).toBeUndefined()
        })
      })

      it('is default', () => {
        return getUserEditor().then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).toHaveLength(4)
          expect(preferredOpener).toBeUndefined()
        })
      })
    })
  })

  describe('#setUserEditor', () => {
    it('sets the preferred editor', () => {
      const editor = {}

      return setUserEditor(editor).then(() => {
        expect(stateMock.set).toHaveBeenCalledWith({ preferredOpener: editor })
      })
    })
  })
})
