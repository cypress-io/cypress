import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as shellUtil from '../../../lib/util/shell'
import * as envEditors from '../../../lib/util/env-editors'

import { getUserEditors } from '../../../lib/util/editors'

const setPlatform = (platform: string) => {
  Object.defineProperty(process, 'platform', {
    value: platform,
  })
}

describe('lib/util/editors', () => {
  describe('#getUserEditors', () => {
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
      }, {
        id: 'atom',
        binary: 'atom',
        name: 'Atom',
      }])

      vi.spyOn(shellUtil, 'commandExists').mockImplementation((command) => {
        const exists = ['code', 'subl', 'vim', 'zed'].includes(command)

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

    it('lists the file system opener first, then editors that exist', async () => {
      const editors = await getUserEditors()

      expect(editors.map((editor) => editor.id)).toEqual(['computer', 'sublimetext', 'code', 'vim'])
    })

    it('computer option is Finder on MacOS', async () => {
      expect((await getUserEditors())[0].name).toBe('Finder')
    })

    it('computer option is File System on Linux', async () => {
      setPlatform('linux')

      expect((await getUserEditors())[0].name).toBe('File System')
    })

    it('computer option is File Explorer on Windows', async () => {
      setPlatform('win32')

      expect((await getUserEditors())[0].name).toBe('File Explorer')
    })

    it('computer option defaults to File System', async () => {
      setPlatform('unknown')

      expect((await getUserEditors())[0].name).toBe('File System')
    })

    describe('LAUNCH_EDITOR', () => {
      it('is listed when it names a command that exists', async () => {
        vi.stubEnv('LAUNCH_EDITOR', 'zed')

        expect(await getUserEditors()).toContainEqual({ id: 'launch-editor', name: 'LAUNCH_EDITOR (zed)', binary: 'zed' })
      })

      it('is not listed when its command does not exist', async () => {
        vi.stubEnv('LAUNCH_EDITOR', '/missing/editor')

        expect((await getUserEditors()).map((editor) => editor.id)).not.toContain('launch-editor')
      })

      it('is not listed when unset', async () => {
        expect((await getUserEditors()).map((editor) => editor.id)).not.toContain('launch-editor')
      })

      it('is not listed again when it names an editor that is already detected', async () => {
        vi.stubEnv('LAUNCH_EDITOR', 'code')

        const editors = await getUserEditors()

        expect(editors.filter((editor) => editor.binary === 'code')).toEqual([{ id: 'code', name: 'Visual Studio Code', binary: 'code' }])
      })
    })
  })
})
