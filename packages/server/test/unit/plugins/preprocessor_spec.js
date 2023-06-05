require('../../spec_helper')

const Fixtures = require('@tooling/system-tests')
const path = require('path')
const appData = require(`../../../lib/util/app_data`)

const plugins = require(`../../../lib/plugins`)
const preprocessor = require(`../../../lib/plugins/preprocessor`)

describe('lib/plugins/preprocessor', () => {
  beforeEach(function () {
    Fixtures.scaffold()
    this.todosPath = Fixtures.projectPath('todos')

    this.filePath = 'path/to/test.coffee'
    this.fullFilePath = path.join(this.todosPath, this.filePath)

    this.testPath = path.join(this.todosPath, 'test.coffee')
    this.localPreprocessorPath = path.join(this.todosPath, 'prep.coffee')

    this.plugin = sinon.stub().returns(new Promise((resolve) => resolve('/path/to/output.js')))
    plugins.registerEvent('file:preprocessor', this.plugin)

    preprocessor.close()

    this.config = {
      preprocessor: 'custom',
      projectRoot: this.todosPath,
    }
  })

  context('#getFile', () => {
    it('executes the plugin with file path', function () {
      preprocessor.getFile(this.filePath, this.config)
      expect(this.plugin).to.be.called

      expect(this.plugin.lastCall.args[0].filePath).to.equal(this.fullFilePath)
    })

    it('executes the plugin with output path', function () {
      preprocessor.getFile(this.filePath, this.config)
      const expectedPath = appData.projectsPath(appData.toHashName(this.todosPath), 'bundles', this.filePath)

      expect(this.plugin.lastCall.args[0].outputPath).to.equal(expectedPath)
    })

    it('returns a promise resolved with the plugin\'s outputPath', function () {
      return preprocessor.getFile(this.filePath, this.config).then((filePath) => {
        expect(filePath).to.equal('/path/to/output.js')
      })
    })

    it('emits \'file:updated\' with filePath when \'rerun\' is emitted', function () {
      const fileUpdated = sinon.spy()

      preprocessor.emitter.on('file:updated', fileUpdated)
      preprocessor.getFile(this.filePath, this.config)
      this.plugin.lastCall.args[0].emit('rerun')

      expect(fileUpdated).to.be.calledWith(this.fullFilePath)
    })

    it('invokes plugin again when isTextTerminal: false', function () {
      this.config.isTextTerminal = false
      preprocessor.getFile(this.filePath, this.config)
      preprocessor.getFile(this.filePath, this.config)

      expect(this.plugin).to.be.calledTwice
    })

    it('does not invoke plugin again when isTextTerminal: true', function () {
      this.config.isTextTerminal = true
      preprocessor.getFile(this.filePath, this.config)
      preprocessor.getFile(this.filePath, this.config)

      expect(this.plugin).to.be.calledOnce
    })
  })

  context('#removeFile', () => {
    it('emits \'close\'', function () {
      preprocessor.getFile(this.filePath, this.config)
      const onClose = sinon.spy()

      this.plugin.lastCall.args[0].on('close', onClose)
      preprocessor.removeFile(this.filePath, this.config)

      expect(onClose).to.be.called
    })

    it('emits \'close\' with file path on base emitter', function () {
      const onClose = sinon.spy()

      preprocessor.emitter.on('close', onClose)
      preprocessor.getFile(this.filePath, this.config)
      preprocessor.removeFile(this.filePath, this.config)

      expect(onClose).to.be.calledWith(this.fullFilePath)
    })
  })

  context('#close', () => {
    it('emits \'close\' on config emitter', function () {
      preprocessor.getFile(this.filePath, this.config)
      const onClose = sinon.spy()

      this.plugin.lastCall.args[0].on('close', onClose)
      preprocessor.close()

      expect(onClose).to.be.called
    })

    it('emits \'close\' on base emitter', function () {
      const onClose = sinon.spy()

      preprocessor.emitter.on('close', onClose)
      preprocessor.getFile(this.filePath, this.config)
      preprocessor.close()

      expect(onClose).to.be.called
    })
  })

  context('#clientSideError', () => {
    beforeEach(() => {
      return sinon.stub(console, 'error')
    }) // keep noise out of console

    it('send javascript string with the error', () => {
      expect(preprocessor.clientSideError('an error')).to.equal(`\
(function () {
  Cypress.action("spec:script:error", {
    type: "BUNDLE_ERROR",
    error: "an error"
  })
}())\
`)
    })

    it('does not replace new lines with {newline} placeholder', () => {
      expect(preprocessor.clientSideError('with\nnew\nlines')).to.include('error: "with\\nnew\\nlines"')
    })

    it('does not remove command line syntax highlighting characters', () => {
      expect(preprocessor.clientSideError('[30mfoo[100mbar[7mbaz')).to.include('error: "[30mfoo[100mbar[7mbaz"')
    })
  })

  context('#errorMessage', () => {
    it('handles error strings', () => {
      expect(preprocessor.errorMessage('error string')).to.include('error string')
    })

    it('handles standard error objects and sends the stack', () => {
      const err = new Error()

      err.stack = 'error object stack'

      expect(preprocessor.errorMessage(err)).to.equal('error object stack')
    })

    it('sends err.annotated if stack is not present', () => {
      const err = {
        stack: undefined,
        annotated: 'annotation',
      }

      expect(preprocessor.errorMessage(err)).to.equal('annotation')
    })

    it('sends err.message if stack and annotated are not present', () => {
      const err = {
        stack: undefined,
        message: 'message',
      }

      expect(preprocessor.errorMessage(err)).to.equal('message')
    })

    it('does not remove stack lines', () => {
      expect(preprocessor.errorMessage('foo\n  at what.ever (foo 23:30)\n baz\n    at where.ever (bar 1:5)'))
      .to.equal('foo\n  at what.ever (foo 23:30)\n baz\n    at where.ever (bar 1:5)')
    })
  })
})
