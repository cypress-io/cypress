import _ from 'lodash'
import Bluebird from 'bluebird'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiSubset from 'chai-subset'
import sinon from 'sinon'

import shellUtil from '../../../lib/util/shell.js'
import { getUserEditors } from '../../../lib/util/editors'
import savedState from '../../../lib/saved_state'

chai.use(chaiAsPromised)
chai.use(chaiSubset)

describe('lib/util/editors', () => {
  context('#getUserEditors', () => {
    beforeEach(() => {
      sinon.stub(savedState, 'create').resolves({
        get () {},
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
      return getUserEditors().then((editors) => {
        const names = _.map(editors, 'name')

        expect(names).to.eql(['Sublime Text', 'Visual Studio Code', 'Vim', 'Other'])
        // @ts-ignore
        expect(editors[3]).to.containSubset({
          id: 'other',
          name: 'Other',
          paths: [],
        })
      })
    })

    it('includes user-set path for "Other" option if available', () => {
      // @ts-ignore
      savedState.create.resolves({
        foo: 'bar',
        get () {
          return { preferredEditorPath: '/path/to/editor' }
        },
      })

      return getUserEditors().then((editors) => {
        expect(editors[3].paths[0]).to.equal('/path/to/editor')
      })
    })
  })
})
