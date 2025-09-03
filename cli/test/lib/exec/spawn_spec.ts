import '../../spec_helper'
import cp from 'child_process'
import os from 'os'
import tty from 'tty'
import path from 'path'
import { EventEmitter as EE } from 'events'
import mockedEnv from 'mocked-env'
import readline from 'readline'
import createDebug from 'debug'
import snapshot from '../../support/snapshot'
import state from '../../../lib/tasks/state'
import xvfb from '../../../lib/exec/xvfb'
import spawn from '../../../lib/exec/spawn'
import verify from '../../../lib/tasks/verify'
import util from '../../../lib/util'

const debug = createDebug('test')

const cwd = process.cwd()
const execPath = process.execPath
const nodeVersion = process.versions.node

const defaultBinaryDir = '/default/binary/dir'
let mockReadlineEE: any

describe('lib/exec/spawn', function () {
  beforeEach(function () {
    (os.platform as any).returns('darwin')
    sinon.stub(process, 'exit')

    ;(this as any).spawnedProcess = {
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
    ;(this as any).processStdin = new EE()
    mockReadlineEE = new EE()

    ;(this as any).processStdin.pipe = sinon.stub().returns(undefined)
    sinon.stub(process, 'stdin').value((this as any).processStdin)
    sinon.stub(readline, 'createInterface').returns(mockReadlineEE)
    sinon.stub(cp, 'spawn').returns((this as any).spawnedProcess)
    sinon.stub(xvfb, 'start').resolves()
    sinon.stub(xvfb, 'stop').resolves()
    sinon.stub(xvfb, 'isNeeded').returns(false)
    sinon.stub(state, 'getBinaryDir').returns(defaultBinaryDir)
    sinon.stub(state, 'getPathToExecutable').withArgs(defaultBinaryDir).returns('/path/to/cypress')
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
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)
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
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)
      sinon.stub(verify, 'needsSandbox').returns(true)

      return spawn.start('--foo', { foo: 'bar' })
      .then(() => {
        // skip the options argument: we do not need anything about it
        // and also less risk that a failed assertion would dump the
        // entire ENV object with possible sensitive variables
        const args = (cp.spawn as any).firstCall.args.slice(0, 2)
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
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)
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
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)
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
      (xvfb.isNeeded as any).returns(true)

      ;(this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start('--foo')
      .then(() => {
        expect(xvfb.start).to.be.calledOnce
      })
    })

    context('closes', function () {
      ['close', 'exit'].forEach((event) => {
        it(`if '${event}' event fired`, function () {
          (this as any).spawnedProcess.on.withArgs(event).yieldsAsync(0)

          return spawn.start('--foo')
        })
      })

      it('if exit event fired and close event fired', function () {
        (this as any).spawnedProcess.on.withArgs('exit').yieldsAsync(0)

        ;(this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

        return spawn.start('--foo')
      })
    })

    context('detects kill signal', function () {
      it('exits with error on SIGKILL', function () {
        (this as any).spawnedProcess.on.withArgs('exit').yieldsAsync(null, 'SIGKILL')

        return spawn.start('--foo')
        .then(() => {
          throw new Error('should have hit error handler but did not')
        }, (e: any) => {
          debug('error message', e.message)
          snapshot(e.message)
        })
      })
    })

    it('does not start xvfb when its not needed', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start('--foo')
      .then(() => {
        expect(xvfb.start).not.to.be.called
      })
    })

    it('stops xvfb when spawn closes', function () {
      (xvfb.isNeeded as any).returns(true)

      ;(this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      ;(this as any).spawnedProcess.on.withArgs('close').yields()

      return spawn.start('--foo')
      .then(() => {
        expect(xvfb.stop).to.be.calledOnce
      })
    })

    it('resolves with spawned close code in the message', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(10)

      return spawn.start('--foo')
      .then((code: any) => {
        expect(code).to.equal(10)
      })
    })

    describe('Linux display', () => {
      let restore: any

      beforeEach(() => {
        restore = mockedEnv({
          DISPLAY: 'test-display',
        })
      })

      afterEach(() => {
        restore()
      })

      it('retries with xvfb if fails with display exit code', function () {
        (this as any).spawnedProcess.on.withArgs('close').onFirstCall().yieldsAsync(1)

        ;(this as any).spawnedProcess.on.withArgs('close').onSecondCall().yieldsAsync(0)

        const buf1 = '[some noise here] Gtk: cannot open display: 987'

        ;(this as any).spawnedProcess.stderr.on
        .withArgs('data')
        .yields(buf1)

        ;(os.platform as any).returns('linux')

        return spawn.start('--foo')
        .then((code: any) => {
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

      ;(this as any).spawnedProcess.on.withArgs('error').yieldsAsync(new Error(msg))

      return spawn.start('--foo')
      .then(() => {
        throw new Error('should have hit error handler but did not')
      }, (e: any) => {
        debug('error message', e.message)
        expect(e.message).to.include(msg)
      })
    })

    it('unrefs if options.detached is true', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start(null, { detached: true })
      .then(() => {
        expect((this as any).spawnedProcess.unref).to.be.calledOnce
      })
    })

    it('does not unref by default', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      // @ts-expect-error - invalid number of arguments for given type
      return spawn.start()
      .then(() => {
        expect((this as any).spawnedProcess.unref).not.to.be.called
      })
    })

    it('sets process.env to options.env', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      process.env.FOO = 'bar'

      // @ts-expect-error - invalid number of arguments for given type
      return spawn.start()
      .then(() => {
        expect((cp.spawn as any).firstCall.args[2].env.FOO).to.eq('bar')
      })
    })

    it('forces colors and streams when supported', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      sinon.stub(util, 'supportsColor').returns(true)
      sinon.stub(tty, 'isatty').returns(true)

      return spawn.start([], { env: {} })
      .then(() => {
        snapshot((cp.spawn as any).firstCall.args[2].env)
      })
    })

    it('sets windowsHide:false property in windows', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      ;(os.platform as any).returns('win32')

      return spawn.start([], { env: {} })
      .then(() => {
        expect((cp.spawn as any).firstCall.args[2].windowsHide).to.be.false
      })
    })

    it('propagates treeKill if SIGINT is detected in windows console', async function () {
      (this as any).spawnedProcess.pid = 7

      ;(this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      ;(os.platform as any).returns('win32')

      const treeKillMock = sinon.stub().returns(0)

      const proxyquire = await import('proxyquire')
      const spawn = proxyquire.default(`../../../lib/exec/spawn`, { 'tree-kill': treeKillMock }).default

      await spawn.start([], { env: {} })

      mockReadlineEE.emit('SIGINT')
      // since the import of tree-kill is async inside spawn, we need to wait for it to be imported and called
      await new Promise<void>((resolve) => {
        setTimeout(resolve)
      })

      expect(treeKillMock).to.have.been.calledWith(7, 'SIGINT')
    })

    it('does not set windowsHide property when in darwin', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      return spawn.start([], { env: {} })
      .then(() => {
        expect((cp.spawn as any).firstCall.args[2].windowsHide).to.be.undefined
      })
    })

    it('does not force colors and streams when not supported', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      sinon.stub(util, 'supportsColor').returns(false)
      sinon.stub(tty, 'isatty').returns(false)

      return spawn.start([], { env: {} })
      .then(() => {
        snapshot((cp.spawn as any).firstCall.args[2].env)
      })
    })

    it('pipes when on win32', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      ;(os.platform as any).returns('win32')

      ;(xvfb.isNeeded as any).returns(false)

      // @ts-expect-error - invalid number of arguments for given type
      return spawn.start()
      .then(() => {
        expect((cp.spawn as any).firstCall.args[2].stdio).to.deep.eq('pipe')
        // parent process STDIN was piped to child process STDIN
        expect((this as any).processStdin.pipe, 'process.stdin').to.have.been.calledOnce
        .and.to.have.been.calledWith((this as any).spawnedProcess.stdin)
      })
    })

    it('inherits when on linux and xvfb isn\'t needed', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      ;(os.platform as any).returns('linux')

      ;(xvfb.isNeeded as any).returns(false)

      // @ts-expect-error - invalid number of arguments for given type
      return spawn.start()
      .then(() => {
        expect((cp.spawn as any).firstCall.args[2].stdio).to.deep.eq('inherit')
      })
    })

    it('uses [inherit, inherit, pipe] when linux and xvfb is needed', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      ;(xvfb.isNeeded as any).returns(true)

      ;(os.platform as any).returns('linux')

      // @ts-expect-error - invalid number of arguments for given type
      return spawn.start()
      .then(() => {
        expect((cp.spawn as any).firstCall.args[2].stdio).to.deep.eq([
          'inherit', 'inherit', 'pipe',
        ])
      })
    })

    it('uses [inherit, inherit, pipe] on darwin', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      ;(xvfb.isNeeded as any).returns(false)

      ;(os.platform as any).returns('darwin')

      // @ts-expect-error - invalid number of arguments for given type
      return spawn.start()
      .then(() => {
        expect((cp.spawn as any).firstCall.args[2].stdio).to.deep.eq([
          'inherit', 'inherit', 'pipe',
        ])
      })
    })

    it('writes everything on win32', function () {
      const buf1 = Buffer.from('asdf')

      ;(this as any).spawnedProcess.stdin.pipe.withArgs(process.stdin)

      ;(this as any).spawnedProcess.stdout.pipe.withArgs(process.stdout)

      ;(this as any).spawnedProcess.stderr.on
      .withArgs('data')
      .yields(buf1)

      ;(this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      sinon.stub(process.stderr, 'write').withArgs(buf1)

      ;(os.platform as any).returns('win32')

      // @ts-expect-error - invalid number of arguments for given type
      return spawn.start()
    })

    // https://github.com/cypress-io/cypress/issues/1841
    // https://github.com/cypress-io/cypress/issues/5241
    ;['EPIPE', 'ENOTCONN'].forEach((errCode) => {
      it(`catches process.stdin errors and returns when code=${errCode}`, function () {
        (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

        // @ts-expect-error - invalid number of arguments for given type
        return spawn.start()
        .then(() => {
          let called = false

          const fn = () => {
            called = true
            const err: any = new Error()

            err.code = errCode

            return process.stdin.emit('error', err)
          }

          expect(fn).not.to.throw()
          expect(called).to.be.true
        })
      })
    })

    it('throws process.stdin errors code!=EPIPE', function () {
      (this as any).spawnedProcess.on.withArgs('close').yieldsAsync(0)

      // @ts-expect-error - invalid number of arguments for given type
      return spawn.start()
      .then(() => {
        const fn = () => {
          const err: any = new Error('wattttt')

          err.code = 'FAILWHALE'

          return process.stdin.emit('error', err)
        }

        expect(fn).to.throw(/wattttt/)
      })
    })
  })
})
