require('../../spec_helper')

const path = require('path')
const { fs } = require('../../../lib/util/fs')

describe('privileged channel', () => {
  let runPrivilegedChannel
  let win

  beforeEach(async () => {
    const secureChannelScript = (await fs.readFileAsync(path.join(__dirname, '..', '..', '..', 'lib', 'privileged-commands', 'privileged-channel.js'))).toString()

    // need to pull out the methods like this so when they're overwritten
    // in the tests, they don't mess up the actual globals since the test
    // runner itself relies on them
    win = {
      Array: { prototype: {
        filter: Array.prototype.filter,
        includes: Array.prototype.includes,
        map: Array.prototype.map,
      } },
      Error,
      Cypress: {
        on () {},
      },
      fetch: sinon.stub().resolves(),
      Function: { prototype: {
        toString: Function.prototype.toString,
      } },
      JSON: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
      String: { prototype: {
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
})
