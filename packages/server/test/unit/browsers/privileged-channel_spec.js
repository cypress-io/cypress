require('../../spec_helper')

const path = require('path')
const { fs } = require('../../../lib/util/fs')

describe('privileged channel', () => {
  let runPrivilegedChannel
  let win

  beforeEach(async () => {
    const secureChannelScript = (await fs.readFileAsync(path.join(__dirname, '..', '..', '..', 'lib', 'privileged-commands', 'privileged-channel.js'))).toString()
    const ErrorStub = function (message) {
      return new Error(message)
    }

    ErrorStub.captureStackTrace = sinon.stub()

    // need to pull out the methods like this so when they're overwritten
    // in the tests, they don't mess up the actual globals since the test
    // runner itself relies on them
    win = {
      Array: {
        isArray: Array.isArray,
        prototype: {
          filter: Array.prototype.filter,
          includes: Array.prototype.includes,
          map: Array.prototype.map,
          slice: Array.prototype.slice,
        },
      },
      Error: ErrorStub,
      Cypress: {
        on () {},
      },
      fetch: sinon.stub().resolves(),
      Function: { prototype: {
        toString: Function.prototype.toString,
      } },
      location: {
        origin: 'http://localhost:1234',
      },
      Math: {
        imul: Math.imul,
      },
      JSON: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
      String: { prototype: {
        charCodeAt: String.prototype.charCodeAt,
        includes: String.prototype.includes,
        replace: String.prototype.replace,
        split: String.prototype.split,
      } },
    }

    runPrivilegedChannel = () => {
      return eval(`${secureChannelScript}`)({
        browserFamily: 'chromium',
        isSpecBridge: false,
        key: '1234',
        namespace: '__cypress',
        scripts: JSON.stringify(['cypress/e2e/spec.cy.js']),
        url: 'http://localhost:12345/__cypress/tests?p=cypress/integration/some-spec.js',
        win,
      })
    }
  })

  describe('overwriting native objects and methods has no effect', () => {
    it('Error', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Error = sinon.stub()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Error).not.to.be.called
    })

    it('Error.captureStackTrace', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Error.captureStackTrace = sinon.stub()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Error.captureStackTrace).not.to.be.called
    })

    it('Array.prototype.filter', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Array.prototype.filter = sinon.stub()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Array.prototype.filter).not.to.be.called
    })

    it('Array.prototype.includes', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Array.prototype.includes = sinon.stub()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Array.prototype.includes).not.to.be.called
    })

    it('Array.prototype.map', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Array.prototype.map = sinon.stub()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Array.prototype.map).not.to.be.called
    })

    it('String.prototype.split', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.String.prototype.split = sinon.stub()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.String.prototype.split).not.to.be.called
    })

    it('String.prototype.replace', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.String.prototype.replace = sinon.stub()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.String.prototype.replace).not.to.be.called
    })

    it('String.prototype.includes', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.String.prototype.includes = sinon.stub()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.String.prototype.includes).not.to.be.called
    })

    it('Function.prototype.toString', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Function.prototype.toString = sinon.stub()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Function.prototype.toString).not.to.be.called
    })

    it('fetch', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.fetch = sinon.stub().resolves()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.fetch).not.to.be.called
    })

    it('JSON.stringify', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.JSON.stringify = sinon.stub()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.JSON.stringify).not.to.be.called
    })

    it('JSON.parse', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.JSON.parse = sinon.stub()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.JSON.parse).not.to.be.called
    })
  })

  describe('#dropRightUndefined', () => {
    it('removes undefined values from the right side of the array', () => {
      const { dropRightUndefined } = runPrivilegedChannel()

      expect(dropRightUndefined(['one', 'two'])).to.deep.equal(['one', 'two'])
      expect(dropRightUndefined(['one', 'two', undefined])).to.deep.equal(['one', 'two'])
      expect(dropRightUndefined(['one', 'two', undefined, undefined])).to.deep.equal(['one', 'two'])
      expect(dropRightUndefined(['one', 'two', undefined, null])).to.deep.equal(['one', 'two', undefined, null])
      expect(dropRightUndefined(['one', 'two', null, undefined])).to.deep.equal(['one', 'two', null])
    })

    it('does not remove undefined values from the beginning or middle of the array', () => {
      const { dropRightUndefined } = runPrivilegedChannel()

      expect(dropRightUndefined([undefined, 'one', 'two'])).to.deep.equal([undefined, 'one', 'two'])
      expect(dropRightUndefined([undefined, 'one', undefined, 'two'])).to.deep.equal([undefined, 'one', undefined, 'two'])
      expect(dropRightUndefined([undefined, 'one', undefined, 'two', undefined])).to.deep.equal([undefined, 'one', undefined, 'two'])
      expect(dropRightUndefined(['one', undefined, 'two'])).to.deep.equal(['one', undefined, 'two'])
      expect(dropRightUndefined(['one', undefined, 'two', undefined])).to.deep.equal(['one', undefined, 'two'])
    })

    it('returns empty array if not passed an array', () => {
      const { dropRightUndefined } = runPrivilegedChannel()

      expect(dropRightUndefined()).to.deep.equal([])
      expect(dropRightUndefined({})).to.deep.equal([])
      expect(dropRightUndefined(true)).to.deep.equal([])
      expect(dropRightUndefined(123)).to.deep.equal([])
      expect(dropRightUndefined('string')).to.deep.equal([])
    })
  })
})
