require('../../spec_helper')

const os = require('os')
const xvfb = require(`${lib}/exec/xvfb`)

describe('lib/exec/xvfb', function () {
  beforeEach(function () {
    os.platform.returns('win32')
  })

  context('debugXvfb', function () {
    const { Debug } = xvfb._debugXvfb
    const { namespaces } = Debug

    beforeEach(() => {
      Debug.enable(namespaces)
    })

    afterEach(() => {
      Debug.enable(namespaces)
    })

    it('outputs when enabled', function () {
      sinon.stub(process.stderr, 'write').returns(undefined)
      Debug.enable(xvfb._debugXvfb.namespace)

      xvfb._xvfb._onStderrData('asdf')

      expect(process.stderr.write).to.be.calledWithMatch('cypress:xvfb')
      expect(process.stderr.write).to.be.calledWithMatch('asdf')
    })

    it('does not output when disabled', function () {
      sinon.stub(process.stderr, 'write')
      Debug.disable()

      xvfb._xvfb._onStderrData('asdf')

      expect(process.stderr.write).not.to.be.calledWithMatch('cypress:xvfb')
      expect(process.stderr.write).not.to.be.calledWithMatch('asdf')
    })
  })

  context('xvfbOptions', function () {
    it('sets explicit screen', () => {
      expect(xvfb._xvfbOptions).to.have.property('xvfb_args').that.includes('-screen')
    })
  })

  context('#start', function () {
    it('passes', function () {
      sinon.stub(xvfb._xvfb, 'startAsync').resolves()

      return xvfb.start()
    })

    it('fails with error message', function () {
      const message = 'nope'

      sinon.stub(xvfb._xvfb, 'startAsync').rejects(new Error(message))

      return xvfb.start()
      .then(() => {
        throw new Error('Should have thrown an error')
      })
      .catch((err) => {
        expect(err.message).to.include(message)
      })
    })

    it('fails when xvfb exited with non zero exit code', function () {
      const e = new Error('something bad happened')

      e.nonZeroExitCode = true

      sinon.stub(xvfb._xvfb, 'startAsync').rejects(e)

      return xvfb.start()
      .then(() => {
        throw new Error('Should have thrown an error')
      })
      .catch((err) => {
        expect(err.known).to.be.true
        expect(err.message).to.include('something bad happened')
        expect(err.message).to.include('Xvfb exited with a non zero exit code.')
      })
    })
  })

  context('#isNeeded', function () {
    it('does not need xvfb on osx', function () {
      os.platform.returns('darwin')

      expect(xvfb.isNeeded()).to.be.false
    })

    it('does not need xvfb on linux when DISPLAY is set', function () {
      os.platform.returns('linux')

      process.env.DISPLAY = ':99'

      expect(xvfb.isNeeded()).to.be.false
    })

    it('does need xvfb on linux when no DISPLAY is set', function () {
      os.platform.returns('linux')

      expect(xvfb.isNeeded()).to.be.true
    })
  })
})
