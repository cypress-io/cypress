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

    it('returns a list of editors on the user\'s system with an "Other" option appended', () => {
      return getUserEditor().then(({ availableEditors }) => {
        const names = _.map(availableEditors, 'name')

        expect(names).to.eql(['Sublime Text', 'Visual Studio Code', 'Vim', 'Other'])
        expect(availableEditors[3]).to.eql({
          id: 'other',
          name: 'Other',
          isOther: true,
          openerId: '',
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
        expect(availableEditors[3].openerId).to.equal('/path/to/editor')
      })
    })

    describe('when alwaysIncludeEditors is true', () => {
      it('returns editors along with preferred editor', () => {
        const preferredEditor = {}

        // @ts-ignore
        savedState.create.resolves({
          get () {
            return { preferredEditor }
          },
        })

        return getUserEditor(true).then(({ availableEditors, preferredEditor }) => {
          expect(availableEditors).to.have.length(4)
          expect(preferredEditor).to.equal(preferredEditor)
        })
      })
    })

    describe('when alwaysIncludeEditors is false', () => {
      it('only returns preferred editor if one has been saved', () => {
        const preferredEditor = {}

        // @ts-ignore
        savedState.create.resolves({
          get () {
            return { preferredEditor }
          },
        })

        return getUserEditor(false).then(({ availableEditors, preferredEditor }) => {
          expect(availableEditors).to.be.undefined
          expect(preferredEditor).to.equal(preferredEditor)
        })
      })

      it('returns available editors if preferred editor has not been saved', () => {
        return getUserEditor(false).then(({ availableEditors, preferredEditor }) => {
          expect(availableEditors).to.have.length(4)
          expect(preferredEditor).to.be.undefined
        })
      })

      it('is default', () => {
        return getUserEditor().then(({ availableEditors, preferredEditor }) => {
          expect(availableEditors).to.have.length(4)
          expect(preferredEditor).to.be.undefined
        })
      })
    })
  })
})
