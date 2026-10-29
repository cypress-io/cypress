import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
  let stateMock: { get: ReturnType<typeof vi.fn>, set: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    stateMock = {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn(),
    }

    vi.spyOn(savedState, 'create').mockResolvedValue(stateMock as any)
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

      vi.stubEnv('LAUNCH_EDITOR', '')

      platform = process.platform
      setPlatform('darwin')
    })

    afterEach(() => {
      setPlatform(platform)
      vi.restoreAllMocks()
      vi.unstubAllEnvs()
    })

    it('does not list a saved custom editor', async () => {
      vi.spyOn(savedState, 'create').mockResolvedValue({
        get () {
          return Promise.resolve({ preferredOpener: { id: 'other', name: 'Other', binary: '/path/to/editor' } })
        },
      } as any)

      const { availableEditors } = await getUserEditor(true)

      expect(availableEditors.map((editor) => editor.binary)).not.toContain('/path/to/editor')
    })

    describe('LAUNCH_EDITOR', () => {
      it('is listed when it names a command that exists', async () => {
        vi.stubEnv('LAUNCH_EDITOR', 'code')

        const { availableEditors } = await getUserEditor(true)

        expect(availableEditors).toContainEqual({ id: 'launch-editor', name: 'LAUNCH_EDITOR (code)', binary: 'code' })
      })

      it('is not listed when its command does not exist', async () => {
        vi.stubEnv('LAUNCH_EDITOR', '/missing/editor')

        const { availableEditors } = await getUserEditor(true)

        expect(availableEditors.map((editor) => editor.id)).not.toContain('launch-editor')
      })

      it('is not listed when unset', async () => {
        const { availableEditors } = await getUserEditor(true)

        expect(availableEditors.map((editor) => editor.id)).not.toContain('launch-editor')
      })
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
        } as any)

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
        } as any)

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
