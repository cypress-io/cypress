require('../../spec_helper')

const _ = require('lodash')
const cp = require('child_process')
const os = require('os')
const tty = require('tty')
const path = require('path')
const EE = require('events')
const mockedEnv = require('mocked-env')
const debug = require('debug')('test')

const state = require(`${lib}/tasks/state`)
const xvfb = require(`${lib}/exec/xvfb`)
const spawn = require(`${lib}/exec/spawn`)
const verify = require(`${lib}/tasks/verify`)
const util = require(`${lib}/util.js`)
const expect = require('chai').expect
const snapshot = require('../../support/snapshot')

const cwd = process.cwd()
const execPath = process.execPath
const nodeVersion = process.versions.node

const defaultBinaryDir = '/default/binary/dir'

describe('lib/exec/spawn', function () {
  beforeEach(function () {
    os.platform.returns('darwin')
    sinon.stub(process, 'exit')
    this.spawnedProcess = {
      on: sinon.stub().returns(undefined),
      unref: sinon.stub().returns(undefined),
      stdin: {
        on: sinon.stub().returns(undefined),
        pipe: sinon.stub().returns(undefined),
      },
      stdout: {
        on: sinon.stub().returns(undefined),
        pipe: sinon.stub().returns(undefined),
      },
      stderr: {
        pipe: sinon.stub().returns(undefined),
        on: sinon.stub().returns(undefined),
      },
      kill: sinon.stub(),
      // expected by sinon
      cancel: sinon.stub(),
    }

    // process.stdin is both an event emitter and a readable stream
    this.processStdin = new EE()
    this.processStdin.pipe = sinon.stub().returns(undefined)
    sinon.stub(process, 'stdin').value(this.processStdin)
    sinon.stub(cp, 'spawn').returns(this.spawnedProcess)
    sinon.stub(xvfb, 'start').resolves()
    sinon.stub(xvfb, 'stop').resolves()
    sinon.stub(xvfb, 'isNeeded').returns(false)
    sinon.stub(state, 'getBinaryDir').returns(defaultBinaryDir)
    sinon.stub(state, 'getPathToExecutable').withArgs(defaultBinaryDir).returns('/path/to/cypress')
  })

  context('.isGarbageLineWarning', () => {
    it('returns true', () => {
      const str = `
        [46454:0702/140217.292422:ERROR:gles2_cmd_decoder.cc(4439)] [.RenderWorker-0x7f8bc5815a00.GpuRasterization]GL ERROR :GL_INVALID_FRAMEBUFFER_OPERATION : glDrawElements: framebuffer incomplete
        [46454:0702/140217.292466:ERROR:gles2_cmd_decoder.cc(17788)] [.RenderWorker-0x7f8bc5815a00.GpuRasterization]GL ERROR :GL_INVALID_OPERATION : glCreateAndConsumeTextureCHROMIUM: invalid mailbox name
        [46454:0702/140217.292526:ERROR:gles2_cmd_decoder.cc(4439)] [.RenderWorker-0x7f8bc5815a00.GpuRasterization]GL ERROR :GL_INVALID_FRAMEBUFFER_OPERATION : glClear: framebuffer incomplete
        [46454:0702/140217.292555:ERROR:gles2_cmd_decoder.cc(4439)] [.RenderWorker-0x7f8bc5815a00.GpuRasterization]GL ERROR :GL_INVALID_FRAMEBUFFER_OPERATION : glDrawElements: framebuffer incomplete
        [46454:0702/140217.292584:ERROR:gles2_cmd_decoder.cc(4439)] [.RenderWorker-0x7f8bc5815a00.GpuRasterization]GL ERROR :GL_INVALID_FRAMEBUFFER_OPERATION : glClear: framebuffer incomplete
        [46454:0702/140217.292612:ERROR:gles2_cmd_decoder.cc(4439)] [.RenderWorker-0x7f8bc5815a00.GpuRasterization]GL ERROR :GL_INVALID_FRAMEBUFFER_OPERATION : glDrawElements: framebuffer incomplete'

        [1957:0406/160550.146820:ERROR:bus.cc(392)] Failed to connect to the bus: Failed to connect to socket /var/run/dbus/system_bus_socket: No such file or directory
        [1957:0406/160550.147994:ERROR:bus.cc(392)] Failed to connect to the bus: Address does not contain a colon

        [3801:0606/152837.383892:ERROR:cert_verify_proc_builtin.cc(681)] CertVerifyProcBuiltin for www.googletagmanager.com failed:
        ----- Certificate i=0 (OU=Cypress Proxy Server Certificate,O=Cypress Proxy CA,L=Internet,ST=Internet,C=Internet,CN=www.googletagmanager.com) -----
        ERROR: No matching issuer found

        objc[60540]: Class WebSwapCGLLayer is implemented in both /System/Library/Frameworks/WebKit.framework/Versions/A/Frameworks/WebCore.framework/Versions/A/Frameworks/libANGLE-shared.dylib (0x7ffa5a006318) and /{path/to/app}/node_modules/electron/dist/Electron.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libGLESv2.dylib (0x10f8a89c8). One of the two will be used. Which one is undefined.
      `

      const lines = _
      .chain(str)
      .split('\n')
      .invokeMap('trim')
      .compact()
      .value()

      _.each(lines, (line) => {
        expect(spawn.isGarbageLineWarning(line), `expected line to be garbage: ${line}`).to.be.true
      })
    })
  })

  context('.start', function () {
    // ️️⚠️ NOTE ⚠️
    // when asserting the calls made to spawn the child Cypress process
    // we have to be _very_ careful. Spawn uses process.env object, if an assertion
    // fails, it will print the entire process.env object to the logs, which
    // might contain sensitive environment variables. Think about what the
    // failed assertion might print to the public CI logs and limit
    // the environment variables when running tests on CI.

    it('passes args + options to spawn', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      sinon.stub(verify, 'needsSandbox').returns(false)

      return spawn.start('--foo', { foo: 'bar' })
      .then(() => {
        expect(cp.spawn).to.be.calledWithMatch('/path/to/cypress', [
          '--',
          '--foo',
          '--cwd',
          cwd,
          '--userNodePath',
          execPath,
          '--userNodeVersion',
          nodeVersion,
        ], {
          detached: false,
          stdio: ['inherit', 'inherit', 'pipe'],
        })
      })
    })

    it('uses --no-sandbox when needed', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      sinon.stub(verify, 'needsSandbox').returns(true)

      return spawn.start('--foo', { foo: 'bar' })
      .then(() => {
        // skip the options argument: we do not need anything about it
        // and also less risk that a failed assertion would dump the
        // entire ENV object with possible sensitive variables
        const args = cp.spawn.firstCall.args.slice(0, 2)
        // it is important for "--no-sandbox" to appear before "--" separator
        const expectedCliArgs = [
          '--no-sandbox',
          '--',
          '--foo',
          '--cwd',
          cwd,
          '--userNodePath',
          execPath,
          '--userNodeVersion',
          nodeVersion,
        ]

        expect(args).to.deep.equal(['/path/to/cypress', expectedCliArgs])
      })
    })

    it('uses npm command when running in dev mode', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      sinon.stub(verify, 'needsSandbox').returns(false)

      const p = path.resolve('..', 'scripts', 'start.js')

      return spawn.start('--foo', { dev: true, foo: 'bar' })
      .then(() => {
        expect(cp.spawn).to.be.calledWithMatch('node', [
          p,
          '--',
          '--foo',
          '--cwd',
          cwd,
          '--userNodePath',
          execPath,
          '--userNodeVersion',
          nodeVersion,
        ], {
          detached: false,
          stdio: ['inherit', 'inherit', 'pipe'],
        })
      })
    })

    it('does not pass --no-sandbox when running in dev mode', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      sinon.stub(verify, 'needsSandbox').returns(true)

      const p = path.resolve('..', 'scripts', 'start.js')

      return spawn.start('--foo', { dev: true, foo: 'bar' })
      .then(() => {
        expect(cp.spawn).to.be.calledWithMatch('node', [
          p,
          '--',
          '--foo',
          '--cwd',
          cwd,
          '--userNodePath',
          execPath,
          '--userNodeVersion',
          nodeVersion,
        ], {
          detached: false,
          stdio: ['inherit', 'inherit', 'pipe'],
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

    context('closes', function () {
      ['close', 'exit'].forEach((event) => {
        it(`if '${event}' event fired`, function () {
          this.spawnedProcess.on.withArgs(event).yieldsAsync(0)

          return spawn.start('--foo')
        })
      })

      it('if exit event fired and close event fired', function () {
        this.spawnedProcess.on.withArgs('exit').yieldsAsync(0)
        this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

        return spawn.start('--foo')
      })
    })

    context('detects kill signal', function () {
      it('exits with error on SIGKILL', function () {
        this.spawnedProcess.on.withArgs('exit').yieldsAsync(null, 'SIGKILL')

        return spawn.start('--foo')
        .then(() => {
          throw new Error('should have hit error handler but did not')
        }, (e) => {
          debug('error message', e.message)
          snapshot(e.message)
        })
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

    describe('Linux display', () => {
      let restore

      beforeEach(() => {
        restore = mockedEnv({
          DISPLAY: 'test-display',
        })
      })

      afterEach(() => {
        restore()
      })

      it('retries with xvfb if fails with display exit code', function () {
        this.spawnedProcess.on.withArgs('close').onFirstCall().yieldsAsync(1)
        this.spawnedProcess.on.withArgs('close').onSecondCall().yieldsAsync(0)

        const buf1 = '[some noise here] Gtk: cannot open display: 987'

        this.spawnedProcess.stderr.on
        .withArgs('data')
        .yields(buf1)

        os.platform.returns('linux')

        return spawn.start('--foo')
        .then((code) => {
          expect(xvfb.start).to.have.been.calledOnce
          expect(xvfb.stop).to.have.been.calledOnce
          expect(cp.spawn).to.have.been.calledTwice
          // second code should be 0 after successfully running with Xvfb
          expect(code).to.equal(0)
        })
      })
    })

    it('rejects with error from spawn', function () {
      const msg = 'the error message'

      this.spawnedProcess.on.withArgs('error').yieldsAsync(new Error(msg))

      return spawn.start('--foo')
      .then(() => {
        throw new Error('should have hit error handler but did not')
      }, (e) => {
        debug('error message', e.message)
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

    it('sets process.env to options.env', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      process.env.FOO = 'bar'

      return spawn.start()
      .then(() => {
        expect(cp.spawn.firstCall.args[2].env.FOO).to.eq('bar')
      })
    })

    it('forces colors and streams when supported', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      sinon.stub(util, 'supportsColor').returns(true)
      sinon.stub(tty, 'isatty').returns(true)

      return spawn.start([], { env: {} })
      .then(() => {
        snapshot(cp.spawn.firstCall.args[2].env)
      })
    })

    it('sets windowsHide:false property in windows', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      os.platform.returns('win32')

      return spawn.start([], { env: {} })
      .then(() => {
        expect(cp.spawn.firstCall.args[2].windowsHide).to.be.false
      })
    })

    it('does not set windowsHide property when in darwin', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start([], { env: {} })
      .then(() => {
        expect(cp.spawn.firstCall.args[2].windowsHide).to.be.undefined
      })
    })

    it('does not force colors and streams when not supported', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      sinon.stub(util, 'supportsColor').returns(false)
      sinon.stub(tty, 'isatty').returns(false)

      return spawn.start([], { env: {} })
      .then(() => {
        snapshot(cp.spawn.firstCall.args[2].env)
      })
    })

    it('pipes when on win32', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      os.platform.returns('win32')
      xvfb.isNeeded.returns(false)

      return spawn.start()
      .then(() => {
        expect(cp.spawn.firstCall.args[2].stdio).to.deep.eq('pipe')
        // parent process STDIN was piped to child process STDIN
        expect(this.processStdin.pipe, 'process.stdin').to.have.been.calledOnce
        .and.to.have.been.calledWith(this.spawnedProcess.stdin)
      })
    })

    it('inherits when on linux and xvfb isnt needed', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)
      os.platform.returns('linux')
      xvfb.isNeeded.returns(false)

      return spawn.start()
      .then(() => {
        expect(cp.spawn.firstCall.args[2].stdio).to.deep.eq('inherit')
      })
    })

    it('uses [inherit, inherit, pipe] when linux and xvfb is needed', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      xvfb.isNeeded.returns(true)
      os.platform.returns('linux')

      return spawn.start()
      .then(() => {
        expect(cp.spawn.firstCall.args[2].stdio).to.deep.eq([
          'inherit', 'inherit', 'pipe',
        ])
      })
    })

    it('uses [inherit, inherit, pipe] on darwin', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      xvfb.isNeeded.returns(false)
      os.platform.returns('darwin')

      return spawn.start()
      .then(() => {
        expect(cp.spawn.firstCall.args[2].stdio).to.deep.eq([
          'inherit', 'inherit', 'pipe',
        ])
      })
    })

    it('writes everything on win32', function () {
      const buf1 = Buffer.from('asdf')

      this.spawnedProcess.stdin.pipe.withArgs(process.stdin)
      this.spawnedProcess.stdout.pipe.withArgs(process.stdout)

      this.spawnedProcess.stderr.on
      .withArgs('data')
      .yields(buf1)

      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      sinon.stub(process.stderr, 'write').withArgs(buf1)
      os.platform.returns('win32')

      return spawn.start()
    })

    it('does not write to process.stderr when from xlib or libudev', function () {
      const buf1 = Buffer.from('Xlib: something foo')
      const buf2 = Buffer.from('libudev something bar')
      const buf3 = Buffer.from('asdf')

      this.spawnedProcess.stderr.on
      .withArgs('data')
      .onFirstCall()
      .yields(buf1)
      .onSecondCall()
      .yields(buf2)
      .onThirdCall()
      .yields(buf3)

      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      sinon.stub(process.stderr, 'write').withArgs(buf3)
      os.platform.returns('linux')
      xvfb.isNeeded.returns(true)

      return spawn.start()
      .then(() => {
        expect(process.stderr.write).not.to.be.calledWith(buf1)
        expect(process.stderr.write).not.to.be.calledWith(buf2)
      })
    })

    it('does not write to process.stderr when from high sierra warnings', function () {
      const buf1 = Buffer.from('2018-05-19 15:30:30.287 Cypress[7850:32145] *** WARNING: Textured Window')
      const buf2 = Buffer.from('asdf')

      this.spawnedProcess.stderr.on
      .withArgs('data')
      .onFirstCall()
      .yields(buf1)
      .onSecondCall(buf2)
      .yields(buf2)

      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      sinon.stub(process.stderr, 'write').withArgs(buf2)
      os.platform.returns('darwin')

      return spawn.start()
      .then(() => {
        expect(process.stderr.write).not.to.be.calledWith(buf1)
      })
    })

    // https://github.com/cypress-io/cypress/issues/1841
    // https://github.com/cypress-io/cypress/issues/5241
    ;['EPIPE', 'ENOTCONN'].forEach((errCode) => {
      it(`catches process.stdin errors and returns when code=${errCode}`, function () {
        this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

        return spawn.start()
        .then(() => {
          let called = false

          const fn = () => {
            called = true
            const err = new Error()

            err.code = errCode

            return process.stdin.emit('error', err)
          }

          expect(fn).not.to.throw()
          expect(called).to.be.true
        })
      })
    })

    it('throws process.stdin errors code!=EPIPE', function () {
      this.spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start()
      .then(() => {
        const fn = () => {
          const err = new Error('wattttt')

          err.code = 'FAILWHALE'

          return process.stdin.emit('error', err)
        }

        expect(fn).to.throw(/wattttt/)
      })
    })
  })
})
