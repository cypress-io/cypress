require("../spec_helper")

tty = require("tty")
ttyUtil = require("#{root}lib/util/tty")

ttys = [process.stdin.isTTY, process.stdout.isTTY, process.stderr.isTTY]

describe "lib/util/tty", ->
  context ".override", ->
    beforeEach ->
      process.env.FORCE_STDIN_TTY = '1'
      process.env.FORCE_STDOUT_TTY = '1'
      process.env.FORCE_STDERR_TTY = '1'

      ## do this so can we see when its modified
      process.stdin.isTTY = 'foo'
      process.stdout.isTTY = 'foo'
      process.stderr.isTTY = 'foo'

    afterEach ->
      ## restore sanity
      process.stdin.isTTY = ttys[0]
      process.stdout.isTTY = ttys[1]
      process.stderr.isTTY = ttys[2]

    it "is noop when not forcing in env", ->
      delete process.env.FORCE_STDIN_TTY
      delete process.env.FORCE_STDOUT_TTY
      delete process.env.FORCE_STDERR_TTY

      ttyUtil.override()

      expect(process.stdin.isTTY).to.eq('foo')
      expect(process.stdout.isTTY).to.eq('foo')
      expect(process.stderr.isTTY).to.eq('foo')

    it "forces process.stderr.isTTY to be true", ->
      ttyUtil.override()

      expect(process.stdin.isTTY).to.be.true
      expect(process.stdout.isTTY).to.be.true
      expect(process.stderr.isTTY).to.be.true

    it "modifies isatty calls", ->
      delete process.env.FORCE_STDERR_TTY

      isatty = sinon.spy(tty, 'isatty')

      ttyUtil.override()

      ## should slurp up the first two calls
      ## and only proxy through the 3rd call
      ## for stderr
      tty.isatty(0)
      tty.isatty(1)
      tty.isatty(2)

      expect(isatty.callCount).to.eq(1)
      expect(isatty.firstCall).to.be.calledWith(2)
