require('../../spec_helper')

const cp = require('child_process')
const os = require('os')
const tty = require('tty')
const path = require('path')

const state = require(`${lib}/tasks/state`)
const xvfb = require(`${lib}/exec/xvfb`)
const spawn = require(`${lib}/exec/spawn`)
const util = require(`${lib}/util.js`)
const expect = require('chai').expect

const cwd = process.cwd()

const defaultBinaryDir = '/default/binary/dir'

describe('lib/exec/spawn', function () {
  beforeEach(function () {
    this.sandbox.stub(os, 'platform').returns('darwin')
    this.sandbox.stub(os, 'release').returns('1.1.1-generic')
    this.sandbox.stub(process, 'exit')
    this.spawnedProcess = this.sandbox.stub({
      on: () => {},
      unref: () => {},
      stderr: this.sandbox.stub({
        on: () => {},
      }),
    })
    this.sandbox.stub(cp, 'spawn').returns(this.spawnedProcess)
    this.sandbox.stub(xvfb, 'start').resolves()
    this.sandbox.stub(xvfb, 'stop').resolves()
    this.sandbox.stub(xvfb, 'isNeeded').returns(false)
    this.sandbox.stub(state, 'getBinaryDir').returns(defaultBinaryDir)
    this.sandbox.stub(state, 'getPathToExecutable').withArgs(defaultBinaryDir).returns('/path/to/cypress')
  })

  context('.start', function () {
    afterEach(() => {
      delete process.env.FORCE_COLOR
      delete process.env.DEBUG_COLORS
      delete process.env.MOCHA_COLORS
      delete process.env.FORCE_STDERR_TTY
    })

    it('passes args + options to spawn', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start('--foo', { foo: 'bar' })
      .then(() => {
        expect(cp.spawn).to.be.calledWithMatch('/path/to/cypress', [
          '--foo',
          '--cwd',
          cwd,
        ], {
          foo: 'bar',
        })
      })
    })

    it('uses npm command when running in dev mode', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      const p = path.resolve('..', 'scripts', 'start.js')

      return spawn.start('--foo', { dev: true, foo: 'bar' })
      .then(() => {
        expect(cp.spawn).to.be.calledWithMatch('node', [
          p,
          '--foo',
          '--cwd',
          cwd,
        ], {
          foo: 'bar',
        })
      })
    })

    it('starts xvfb when needed', function () {
      xvfb.isNeeded.returns(true)

      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start('--foo')
      .then(() => {
        expect(xvfb.start).to.be.calledOnce
      })
    })

    it('does not start xvfb when its not needed', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start('--foo')
      .then(() => {
        expect(xvfb.start).not.to.be.called
      })
    })

    it('stops xvfb when spawn closes', function () {
      xvfb.isNeeded.returns(true)

      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      this.spawnedProcess.on.withArgs('close').yields()

      return spawn.start('--foo')
      .then(() => {
        expect(xvfb.stop).to.be.calledOnce
      })
    })

    it('resolves with spawned close code in the message', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(10)

      return spawn.start('--foo')
      .then((code) => {
        expect(code).to.equal(10)
      })
    })

    it('rejects with error from spawn', function () {
      const msg = 'the error message'
      this.spawnedProcess.on.withArgs('error').yieldsAsync(new Error(msg))


      return spawn.start('--foo')
      .then(() => {
        throw new Error('should have hit error handler but did not')
      }, (e) => {
        expect(e.message).to.include(msg)
      })
    })

    it('unrefs if options.detached is true', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start(null, { detached: true })
      .then(() => {
        expect(this.spawnedProcess.unref).to.be.calledOnce
      })
    })

    it('does not unref by default', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start()
      .then(() => {
        expect(this.spawnedProcess.unref).not.to.be.called
      })
    })

    it('forces colors when colors are supported', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      this.sandbox.stub(util, 'supportsColor').returns(true)

      return spawn.start()
      .then(() => {
        'FORCE_COLOR DEBUG_COLORS MOCHA_COLORS'.split(' ').forEach((prop) => {
          expect(process.env[prop], prop).to.eq('1')
        })
      })
    })

    it('does not force colors when colors are not supported', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      this.sandbox.stub(util, 'supportsColor').returns(false)

      return spawn.start()
      .then(() => {
        'FORCE_COLOR DEBUG_COLORS MOCHA_COLORS'.split(' ').forEach((prop) => {
          expect(process.env[prop], prop).to.be.undefined
        })
      })
    })

    it('forces stderr tty when needs xvfb and stderr is tty', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      this.sandbox.stub(tty, 'isatty').returns(true)
      os.platform.returns('linux')
      xvfb.isNeeded.returns(true)

      return spawn.start()
      .then(() => {
        expect(process.env.FORCE_STDERR_TTY, 'FORCE_STDERR_TTY').to.eq('1')
      })
    })

    it('does not force stderr tty when needs xvfb isnt needed', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      this.sandbox.stub(tty, 'isatty').returns(true)
      os.platform.returns('linux')

      return spawn.start()
      .then(() => {
        expect(process.env.FORCE_STDERR_TTY).to.be.undefined
      })
    })

    it('does not force stderr tty when stderr is not currently tty', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      this.sandbox.stub(tty, 'isatty').returns(false)
      os.platform.returns('linux')
      xvfb.isNeeded.returns(true)

      return spawn.start()
      .then(() => {
        expect(process.env.FORCE_STDERR_TTY).to.be.undefined
      })
    })

    it('writes to process.stderr when piping', function () {
      const buf1 = new Buffer('asdf')

      this.spawnedProcess.stderr.on
      .withArgs('data')
      .yields(buf1)

      xvfb.isNeeded.returns(true)

      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      this.sandbox.stub(process.stderr, 'write')
      this.sandbox.stub(tty, 'isatty').returns(false)
      os.platform.returns('linux')
      xvfb.isNeeded.returns(true)

      return spawn.start()
      .then(() => {
        expect(process.stderr.write).to.be.calledWith(buf1)
      })
    })

    it('does not write to process.stderr when from xlib or libudev', function () {
      const buf1 = new Buffer('Xlib: something foo')
      const buf2 = new Buffer('libudev something bar')

      this.spawnedProcess.stderr.on
      .withArgs('data')
      .onFirstCall()
      .yields(buf1)
      .onSecondCall()
      .yields(buf2)

      xvfb.isNeeded.returns(true)

      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      this.sandbox.stub(process.stderr, 'write')
      this.sandbox.stub(tty, 'isatty').returns(false)
      os.platform.returns('linux')
      xvfb.isNeeded.returns(true)

      return spawn.start()
      .then(() => {
        expect(process.stderr.write).not.to.be.calledWith(buf1)
        expect(process.stderr.write).not.to.be.calledWith(buf2)
      })
    })

    it('uses inherit/inherit/pipe when linux and xvfb is needed', function () {
      xvfb.isNeeded.returns(true)

      os.platform.returns('linux')

      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start()
      .then(() => {
        expect(cp.spawn.firstCall.args[2]).to.deep.eq({
          detached: false,
          stdio: ['inherit', 'inherit', 'pipe'],
        })
      })
    })

    ;['win32', 'darwin', 'linux'].forEach((platform) => {
      it(`uses inherit when '${platform}' and xvfb is not needed`, function () {
        os.platform.returns(platform)

        this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

        return spawn.start()
        .then(() => {
          expect(cp.spawn.firstCall.args[2]).to.deep.eq({
            detached: false,
            stdio: 'inherit',
          })
        })
      })
    })

    it('can accept --binary-folder option', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      state.getPathToExecutable.withArgs('custom/binary/dir').returns('custom/binary/dir/executable')

      return spawn.start([], { binaryFolder: 'custom/binary/dir' })
      .then(() => {
        expect(cp.spawn.firstCall.args[0]).to.equal('custom/binary/dir/executable')
        expect(cp.spawn.firstCall.args[2]).to.not.have.property('binaryFolder')
      })
    })
  })
})
