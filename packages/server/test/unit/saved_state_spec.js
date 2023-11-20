require('../spec_helper')

const path = require('path')
const Promise = require('bluebird')
const { fs } = require(`../../lib/util/fs`)
const FileUtil = require(`../../lib/util/file`)
const appData = require(`../../lib/util/app_data`)

const savedState = require(`../../lib/saved_state`)

describe('lib/saved_state', () => {
  context('#create', () => {
    beforeEach(() => {
      return savedState.create().then((state) => {
        return fs.unlinkAsync(state.path)
      }).catch(() => {}) // ignore error if file didn't exist in the first place
    })

    it('resolves with an instance of FileUtil', () => {
      return savedState.create()
      .then((state) => {
        expect(state).to.be.instanceof(FileUtil)
      })
    })

    it('resolves with a noop instance if isTextTerminal', () => {
      return savedState.create('/foo/bar', true)
      .then((state) => {
        expect(state).to.equal(FileUtil.noopFile)
      })
    })

    it('caches state file instance per path', () => {
      return Promise.all([
        savedState.create('/foo/bar'),
        savedState.create('/foo/bar'),
      ]).spread((a, b) => {
        expect(a).to.equal(b)
      })
    })

    it('returns different state file for different path', () => {
      const a = savedState.create('/foo/bar')
      const b = savedState.create('/foo/baz')

      expect(a).to.not.equal(b)
    })

    it('sets path to project name + hash if projectRoot', () => {
      return savedState.create('/foo/the-project-name')
      .then((state) => {
        expect(state.path).to.include('the-project-name')
      })
    })

    it('sets path __global__ if no projectRoot', () => {
      return savedState.create()
      .then((state) => {
        const expected = path.join(appData.path(), 'projects', '__global__', 'state.json')

        expect(state.path).to.equal(expected)
      })
    })

    it('has an empty state by default', () => {
      return savedState.create()
      .then((state) => state.get())
      .then((state) => {
        expect(state).to.be.empty
      })
    })

    it('only saves allowed keys', () => {
      return savedState.create()
      .then((state) => {
        return state.set({ foo: 'bar', appWidth: 20 })
        .then(() => {
          return state.get()
        })
      }).then((stateObject) => {
        expect(stateObject).to.eql({ appWidth: 20 })
      })
    })

    it('logs error when attempting to set invalid key(s)', () => {
      sinon.spy(console, 'error')

      return savedState.create()
      .then((state) => {
        return state.set({ foo: 'bar', baz: 'qux' })
      }).then(() => {
        // eslint-disable-next-line no-console
        expect(console.error).to.be.calledWith('WARNING: attempted to save state for non-allowed key(s): foo, baz. All keys must be allowed in server/lib/saved_state.ts')
      })
    })
  })
})
