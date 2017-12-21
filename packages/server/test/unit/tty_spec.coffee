require("../spec_helper")

tty = require("tty")
ttyUtil = require("#{root}lib/util/tty")

isTTY = process.stderr.isTTY

describe "lib/util/tty", ->
  context ".override", ->
    beforeEach ->
      process.env.FORCE_STDERR_TTY = '1'

      ## do this so can we see when its modified
      process.stderr.isTTY = undefined

    afterEach ->
      ## restore sanity
      delete process.env.FORCE_STDERR_TTY
      process.stderr.isTTY = isTTY

    it "is noop when not process.env.FORCE_STDERR_TTY", ->
      delete process.env.FORCE_STDERR_TTY

      expect(ttyUtil.override()).to.be.undefined

      expect(process.stderr.isTTY).to.be.undefined

    it "forces process.stderr.isTTY to be true", ->
      ttyUtil.override()

      expect(process.stderr.isTTY).to.be.true

    it "modies isatty calls for stderr", ->
      fd0 = tty.isatty(0)
      fd1 = tty.isatty(1)

      isatty = @sandbox.spy(tty, 'isatty')

      ttyUtil.override()

      expect(tty.isatty(0)).to.eq(fd0)
      expect(isatty.firstCall).to.be.calledWith(0)

      expect(tty.isatty(1)).to.eq(fd1)
      expect(isatty.secondCall).to.be.calledWith(1)

      expect(tty.isatty(2)).to.be.true
      expect(isatty).not.to.be.calledThrice
