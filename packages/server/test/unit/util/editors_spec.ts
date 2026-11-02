import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiSubset from 'chai-subset'
import sinonChai from '@cypress/sinon-chai'
import sinon from 'sinon'

import * as shellUtil from '../../../lib/util/shell'
import * as envEditors from '../../../lib/util/env-editors'

import { getUserEditors } from '../../../lib/util/editors'

chai.use(chaiAsPromised)
chai.use(chaiSubset)
chai.use(sinonChai)

const setPlatform = (platform) => {
  Object.defineProperty(process, 'platform', {
    value: platform,
  })
}

describe('lib/util/editors', () => {
  context('#getUserEditors', () => {
    let platform
    let launchEditor

    beforeEach(() => {
      sinon.stub(envEditors, 'getEnvEditors').returns([{
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

      sinon.stub(shellUtil, 'commandExists').callsFake((command) => {
        const exists = ['code', 'subl', 'vim', 'zed'].includes(command)

        return Promise.resolve(exists)
      })

      launchEditor = process.env.LAUNCH_EDITOR
      delete process.env.LAUNCH_EDITOR

      platform = process.platform
      setPlatform('darwin')
    })

    afterEach(() => {
      setPlatform(platform)
      sinon.restore()

      if (launchEditor === undefined) {
        delete process.env.LAUNCH_EDITOR
      } else {
        process.env.LAUNCH_EDITOR = launchEditor
      }
    })

    it('lists the file system opener first, then editors that exist', async () => {
      const editors = await getUserEditors()

      expect(editors.map((editor) => editor.id)).to.deep.equal(['computer', 'sublimetext', 'code', 'vim'])
    })

    it('computer option is Finder on MacOS', async () => {
      expect((await getUserEditors())[0].name).to.equal('Finder')
    })

    it('computer option is File System on Linux', async () => {
      setPlatform('linux')

      expect((await getUserEditors())[0].name).to.equal('File System')
    })

    it('computer option is File Explorer on Windows', async () => {
      setPlatform('win32')

      expect((await getUserEditors())[0].name).to.equal('File Explorer')
    })

    it('computer option defaults to File System', async () => {
      setPlatform('unknown')

      expect((await getUserEditors())[0].name).to.equal('File System')
    })

    context('LAUNCH_EDITOR', () => {
      it('is listed when it names a command that exists', async () => {
        process.env.LAUNCH_EDITOR = 'zed'

        expect(await getUserEditors()).to.deep.include({ id: 'launch-editor', name: 'LAUNCH_EDITOR (zed)', binary: 'zed' })
      })

      it('is not listed when its command does not exist', async () => {
        process.env.LAUNCH_EDITOR = '/missing/editor'

        expect((await getUserEditors()).map((editor) => editor.id)).not.to.include('launch-editor')
      })

      it('is not listed when unset', async () => {
        expect((await getUserEditors()).map((editor) => editor.id)).not.to.include('launch-editor')
      })

      it('is not listed again when it names an editor that is already detected', async () => {
        process.env.LAUNCH_EDITOR = 'code'

        const editors = await getUserEditors()

        expect(editors.filter((editor) => editor.binary === 'code')).to.deep.equal([{ id: 'code', name: 'Visual Studio Code', binary: 'code' }])
      })
    })
  })
})
