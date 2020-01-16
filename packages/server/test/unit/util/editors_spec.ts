import _ from 'lodash'
import Bluebird from 'bluebird'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiSubset from 'chai-subset'
import sinon from 'sinon'

import shellUtil from '../../../lib/util/shell.js'
import { getUserEditor } from '../../../lib/util/editors'
import savedState from '../../../lib/saved_state'

chai.use(chaiAsPromised)
chai.use(chaiSubset)

describe('lib/util/editors', () => {
  context('#getUserEditor', () => {
    beforeEach(() => {
      sinon.stub(savedState, 'create').resolves({
        get () {
          return {}
        },
      })

      sinon.stub(shellUtil, 'commandExists').callsFake((command) => {
        const exists = ['code', 'subl', 'vim'].includes(command)

        return Bluebird.resolve(exists)
      })
    })

    afterEach(() => {
      sinon.restore()
    })

    it('returns a list of editors on the user\'s system with an "On Computer" option prepended and an "Other" option appended', () => {
      return getUserEditor().then(({ availableEditors }) => {
        const names = _.map(availableEditors, 'name')

        expect(names).to.eql(['On Computer', 'Sublime Text', 'Visual Studio Code', 'Vim', 'Other'])
        expect(availableEditors[0]).to.eql({
          id: 'computer',
          name: 'On Computer',
          isOther: false,
          openerId: 'computer',
          description: 'Opens the file in your system\'s file management application (e.g. Finder, File Explorer)',
        })

        expect(availableEditors[4]).to.eql({
          id: 'other',
          name: 'Other',
          isOther: true,
          openerId: '',
          description: 'Enter the full path to your editor\'s executable',
        })
      })
    })

    it('includes user-set path for "Other" option if available', () => {
      // @ts-ignore
      savedState.create.resolves({
        get () {
          return { isOther: true, openerId: '/path/to/editor' }
        },
      })

      return getUserEditor().then(({ availableEditors }) => {
        expect(availableEditors[4].openerId).to.equal('/path/to/editor')
      })
    })

    describe('when alwaysIncludeEditors is true', () => {
      it('returns editors along with preferred opener', () => {
        const preferredOpener = {}

        // @ts-ignore
        savedState.create.resolves({
          get () {
            return { preferredOpener }
          },
        })

        return getUserEditor(true).then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).to.have.length(5)
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
            return { preferredOpener }
          },
        })

        return getUserEditor(false).then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).to.be.undefined
          expect(preferredOpener).to.equal(preferredOpener)
        })
      })

      it('returns available editors if preferred opener has not been saved', () => {
        return getUserEditor(false).then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).to.have.length(5)
          expect(preferredOpener).to.be.undefined
        })
      })

      it('is default', () => {
        return getUserEditor().then(({ availableEditors, preferredOpener }) => {
          expect(availableEditors).to.have.length(5)
          expect(preferredOpener).to.be.undefined
        })
      })
    })
  })
})
