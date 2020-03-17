require('../spec_helper')

const path = require('path')
const Promise = require('bluebird')
const savedState = require(`${root}lib/saved_state`)
const fs = require(`${root}lib/util/fs`)
const FileUtil = require(`${root}lib/util/file`)
const appData = require(`${root}lib/util/app_data`)
const savedStateUtil = require(`${root}lib/util/saved_state`)

describe('lib/util/saved_state', () => {
  describe('project name hash', () => {
    const projectRoot = '/foo/bar'

    it('starts with folder name', () => {
      const hash = savedStateUtil.toHashName(projectRoot)

      expect(hash).to.match(/^bar-/)
    })

    it('computed for given path', () => {
      const hash = savedStateUtil.toHashName(projectRoot)
      const expected = 'bar-1df481b1ec67d4d8bec721f521d4937d'

      expect(hash).to.equal(expected)
    })

    it('does not handle empty project path', () => {
      const tryWithoutPath = () => {
        return savedStateUtil.toHashName()
      }

      expect(tryWithoutPath).to.throw('Missing project path')
    })
  })
})

describe('lib/saved_state', () => {
  beforeEach(() => {
    return savedState().then((state) => {
      return fs.unlinkAsync(state.path)
    }).catch(() => {}) // ignore error if file didn't exist in the first place
  })

  it('is a function', () => {
    expect(savedState).to.be.a('function')
  })

  it('resolves with an instance of FileUtil', () => {
    return savedState()
    .then((state) => {
      expect(state).to.be.instanceof(FileUtil)
    })
  })

  it('resolves with a noop instance if isTextTerminal', () => {
    return savedState('/foo/bar', true)
    .then((state) => {
      expect(state).to.equal(FileUtil.noopFile)
    })
  })

  it('caches state file instance per path', () => {
    return Promise.all([
      savedState('/foo/bar'),
      savedState('/foo/bar'),
    ]).spread((a, b) => {
      expect(a).to.equal(b)
    })
  })

  it('returns different state file for different path', () => {
    const a = savedState('/foo/bar')
    const b = savedState('/foo/baz')

    expect(a).to.not.equal(b)
  })

  it('sets path to project name + hash if projectRoot', () => {
    return savedState('/foo/the-project-name')
    .then((state) => {
      expect(state.path).to.include('the-project-name')
    })
  })

  it('sets path __global__ if no projectRoot', () => {
    return savedState()
    .then((state) => {
      const expected = path.join(appData.path(), 'projects', '__global__', 'state.json')

      expect(state.path).to.equal(expected)
    })
  })

  it('only saves whitelisted keys', () => {
    return savedState()
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

    return savedState()
    .then((state) => {
      return state.set({ foo: 'bar', baz: 'qux' })
    }).then(() => {
      // eslint-disable-next-line no-console
      expect(console.error).to.be.calledWith('WARNING: attempted to save state for non-whitelisted key(s): foo, baz. All keys must be whitelisted in server/lib/saved_state.js')
    })
  })
})
