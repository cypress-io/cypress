require('../spec_helper')

const xvfb = require('../../lib/exec/xvfb')

const os = require('os')

describe('exec xvfb', function () {
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
