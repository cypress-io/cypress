require('../../spec_helper')

const os = require('os')
const xvfb = require(`${lib}/exec/xvfb`)

describe('exec xvfb', function () {
  context('debugXvfb', function () {
    it('outputs when enabled', function () {
      this.sandbox.stub(process.stderr, 'write')
      this.sandbox.stub(xvfb._debugXvfb, 'enabled').value(true)

      xvfb._xvfb._onStderrData('asdf')

      expect(process.stderr.write).to.be.calledWithMatch('cypress:xvfb')
      expect(process.stderr.write).to.be.calledWithMatch('asdf')
    })

    it('does not output when disabled', function () {
      this.sandbox.stub(process.stderr, 'write')
      this.sandbox.stub(xvfb._debugXvfb, 'enabled').value(false)

      xvfb._xvfb._onStderrData('asdf')

      expect(process.stderr.write).not.to.be.calledWithMatch('cypress:xvfb')
      expect(process.stderr.write).not.to.be.calledWithMatch('asdf')
    })
  })

  context('#start', function () {
    it('passes', function () {
      this.sandbox.stub(xvfb._xvfb, 'startAsync').resolves()
      return xvfb.start()
    })

    it('fails with error message', function () {
      const message = 'nope'
      this.sandbox.stub(xvfb._xvfb, 'startAsync').rejects(new Error(message))
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

      this.sandbox.stub(xvfb._xvfb, 'startAsync').rejects(e)

      return xvfb.start()
      .then(() => {
        throw new Error('Should have thrown an error')
      })
      .catch((err) => {
        expect(err.known).to.be.true
        expect(err.message).to.include('something bad happened')
        expect(err.message).to.include('XVFB exited with a non zero exit code.')
      })
    })
  })

  context('#isNeeded', function () {
    afterEach(() => delete process.env.DISPLAY)

    it('does not need xvfb on osx', function () {
      this.sandbox.stub(os, 'platform').returns('darwin')

      expect(xvfb.isNeeded()).to.be.false
    })

    it('does not need xvfb on linux when DISPLAY is set', function () {
      this.sandbox.stub(os, 'platform').returns('linux')

      process.env.DISPLAY = ':99'

      expect(xvfb.isNeeded()).to.be.false
    })

    it('does need xvfb on linux when no DISPLAY is set', function () {
      this.sandbox.stub(os, 'platform').returns('linux')

      expect(xvfb.isNeeded()).to.be.true
    })
  })
})
