import Bluebird from 'bluebird'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiSubset from 'chai-subset'
import sinonChai from '@cypress/sinon-chai'
import sinon from 'sinon'

import shellUtil from '../../../lib/util/shell.js'
import * as envEditors from '../../../lib/util/env-editors'
import * as savedState from '../../../lib/saved_state'

import { getUserEditor, setUserEditor } from '../../../lib/util/editors'

chai.use(chaiAsPromised)
chai.use(chaiSubset)
chai.use(sinonChai)

const setPlatform = (platform) => {
  Object.defineProperty(process, 'platform', {
    value: platform,
  })
}

describe('lib/util/editors', () => {
  let stateMock

  beforeEach(() => {
    stateMock = {
      get: sinon.stub().resolves({}),
      set: sinon.spy(),
    }

    sinon.stub(savedState, 'create').resolves(stateMock)
  })

  context('#getUserEditor', () => {
    let platform

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
      }])

      sinon.stub(shellUtil, 'commandExists').callsFake((command) => {
        const exists = ['code', 'subl', 'vim'].includes(command)

        return Bluebird.resolve(exists)
      })

      platform = process.platform
      setPlatform('darwin')
    })

    afterEach(() => {
      setPlatform(platform)
      sinon.restore()
    })

    it('includes user-set path for "Other" option if available', () => {
      // @ts-ignore
      savedState.create.resolves({
        get () {
          return Bluebird.resolve({ isOther: true, binary: '/path/to/editor', id: 'other' })
        },
      })
    })

    it('computer option is Finder on MacOS', () => {
      return getUserEditor().then(({ availableEditors }) => {
        expect(availableEditors[0].name).to.equal('Finder')
      })
    })

    it('computer option is File System on Linux', () => {
      setPlatform('linux')

      return getUserEditor().then(({ availableEditors }) => {
        expect(availableEditors[0].name).to.equal('File System')
      })
    })

    it('computer option is File Explorer on Windows', () => {
      setPlatform('win32')

      return getUserEditor().then(({ availableEditors }) => {
        expect(availableEditors[0].name).to.equal('File Explorer')
      })
    })

    it('computer option defaults to File System', () => {
      setPlatform('unknown')

      return getUserEditor().then(({ availableEditors }) => {
        expect(availableEditors[0].name).to.equal('File System')
      })
    })

    describe('when alwaysIncludeEditors is true', () => {
      it('returns editors along with preferred opener', () => {
        const preferredOpener = {}

        // @ts-ignore
        savedState.create.resolves({
          get () {
            return Bluebird.resolve({ preferredOpener })
          },
        })

        return getUserEditor(true).then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).to.have.length(4)
          expect(preferredOpener).to.equal(preferredOpener)
        })
      })
    })

    describe('when alwaysIncludeEditors is false', () => {
      it('only returns preferred opener if one has been saved', () => {
        const preferredOpener = {}

        // @ts-ignore
        savedState.create.resolves({
          get () {
            return Bluebird.resolve({ preferredOpener })
          },
        })

        return getUserEditor(false).then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).to.have.length(0)
          expect(preferredOpener).to.equal(preferredOpener)
        })
      })

      it('returns available editors if preferred opener has not been saved', () => {
        return getUserEditor(false).then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).to.have.length(4)
          expect(preferredOpener).to.be.undefined
        })
      })

      it('is default', () => {
        return getUserEditor().then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).to.have.length(4)
          expect(preferredOpener).to.be.undefined
        })
      })
    })
  })

  context('#setUserEditor', () => {
    it('sets the preferred editor', () => {
      const editor = {}

      return setUserEditor(editor).then(() => {
        expect(stateMock.set).to.be.calledWith({ preferredOpener: editor })
      })
    })
  })
})
