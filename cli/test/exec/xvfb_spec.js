require('../spec_helper')

const os = require('os')
const xvfb = require('../../lib/exec/xvfb')

describe('exec xvfb', function () {
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
        }, (err) => {
          expect(err.message).to.include(message)
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
