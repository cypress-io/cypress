import '../spec_helper'
import os from 'os'
import snapshot from '../support/snapshot'
import Debug from 'debug'
import execa from 'execa-wrap'
import mockedEnv from 'mocked-env'
import { expect } from 'chai'
import mochaBanner from 'mocha-banner'

const debug = Debug('test')

// Import modules dynamically to handle template literal paths
import cli from '../../lib/cli'
import util from '../../lib/util'
import logger from '../../lib/logger'
import info from '../../lib/exec/info'
import run from '../../lib/exec/run'
import open from '../../lib/exec/open'
import cache from '../../lib/tasks/cache'
import state from '../../lib/tasks/state'
import verify from '../../lib/tasks/verify'
import install from '../../lib/tasks/install'
import spawn from '../../lib/exec/spawn'

describe('cli', () => {
  mochaBanner.register()

  beforeEach(function (): void {
    logger.reset()
    // @ts-expect-error
    sinon.stub(process, 'exit').returns(null)

    ;(os.platform as any).returns('darwin')
    // @ts-expect-error
    sinon.stub(util, 'logErrorExit1').returns(null)

    sinon.stub(util, 'pkgBuildInfo').returns({ stable: true })

    ;(this as any).exec = (args: string): any => {
      const cliArgs = `node test ${args}`.split(' ')

      debug('calling cli.init with: %o', cliArgs)

      return cli.init(cliArgs)
    }
  })

  context('unknown option', () => {
    // note it shows help for that specific command
    it('shows help', () => {
      return execa('bin/cypress', ['open', '--foo']).then((result: any) => {
        snapshot('shows help for open --foo 1', result)
      })
    })

    it('shows help for run command', () => {
      return execa('bin/cypress', ['run', '--foo']).then((result: any) => {
        snapshot('shows help for run --foo 1', result)
      })
    })

    it('shows help for cache command - unknown option --foo', () => {
      return execa('bin/cypress', ['cache', '--foo']).then(snapshot)
    })

    it('shows help for cache command - unknown sub-command foo', () => {
      return execa('bin/cypress', ['cache', 'foo']).then(snapshot)
    })

    it('shows help for cache command - no sub-command', () => {
      return execa('bin/cypress', ['cache']).then(snapshot)
    })
  })

  context('help command', () => {
    it('shows help', () => {
      return execa('bin/cypress', ['help']).then(snapshot)
    })

    it('shows help for -h', () => {
      return execa('bin/cypress', ['-h']).then(snapshot)
    })

    it('shows help for --help', () => {
      return execa('bin/cypress', ['--help']).then(snapshot)
    })
  })

  context('unknown command', () => {
    it('shows usage and exits', () => {
      return execa('bin/cypress', ['foo']).then(snapshot)
    })
  })

  context('CYPRESS_INTERNAL_ENV', () => {
    /**
     * Replaces line "Platform: ..." with "Platform: xxx"
     * @param {string} s
     */
    const replacePlatform = (s: string): string => {
      return s.replace(/Platform: .+/, 'Platform: xxx')
    }

    /**
     * Replaces line "Cypress Version: ..." with "Cypress Version: 1.2.3"
     * @param {string} s
     */
    const replaceCypressVersion = (s: string): string => {
      return s.replace(/Cypress Version: .+/, 'Cypress Version: 1.2.3')
    }

    const sanitizePlatform = (text: any): any => {
      return text
      // @ts-expect-error
      .split(os.eol)
      .map(replacePlatform)
      .map(replaceCypressVersion)
      // @ts-expect-error
      .join(os.eol)
    }

    it('allows and warns when staging environment', () => {
      const options = {
        env: {
          CYPRESS_INTERNAL_ENV: 'staging',
        },
        filter: ['code', 'stderr', 'stdout'],
      }

      return execa('bin/cypress', ['help'], options).then(snapshot)
    })

    it('catches environment "foo"', () => {
      const options = {
        env: {
          CYPRESS_INTERNAL_ENV: 'foo',
        },
        // we are only interested in the exit code
        filter: ['code', 'stderr'],
      }

      return execa('bin/cypress', ['help'], options)
      .then(sanitizePlatform)
      .then(snapshot)
    })
  })

  ;['--version', '-v', 'version'].forEach((versionCommand: string) => {
    context(`cypress ${versionCommand}`, () => {
      let restoreEnv: any

      afterEach(() => {
        if (restoreEnv) {
          restoreEnv()
          restoreEnv = null
        }
      })

      const binaryDir = '/binary/dir'

      beforeEach((): void => {
        sinon.stub(state, 'getBinaryDir').returns(binaryDir)
      })

      describe('individual package versions', () => {
        beforeEach((): void => {
          sinon.stub(util, 'pkgVersion').returns('1.2.3')
          sinon
          .stub(state, 'getBinaryPkgAsync')
          .withArgs(binaryDir)
          .resolves({
            version: 'X.Y.Z',
            electronVersion: '10.9.8',
            electronNodeVersion: '7.7.7',
          })
        })

        it('reports just the package version', function (done) {
          (this as any).exec(`${versionCommand} --component package`)

          ;(process.exit as any).callsFake((exitCode: any) => {
            expect(logger.print()).to.equal('1.2.3')
            done()
          })
        })

        it('reports just the binary version', function (done) {
          (this as any).exec(`${versionCommand} --component binary`)

          ;(process.exit as any).callsFake(() => {
            expect(logger.print()).to.equal('X.Y.Z')
            done()
          })
        })

        it('reports just the electron version', function (done) {
          (this as any).exec(`${versionCommand} --component electron`)

          ;(process.exit as any).callsFake(() => {
            expect(logger.print()).to.equal('10.9.8')
            done()
          })
        })

        it('reports just the bundled Node version', function (done) {
          (this as any).exec(`${versionCommand} --component node`)

          ;(process.exit as any).callsFake(() => {
            expect(logger.print()).to.equal('7.7.7')
            done()
          })
        })

        it('handles not found bundled Node version', function (done) {
          state.getBinaryPkgAsync
          .withArgs(binaryDir)
          .resolves({
            version: 'X.Y.Z',
            electronVersion: '10.9.8',
          })

          ;(this as any).exec(`${versionCommand} --component node`)

          ;(process.exit as any).callsFake(() => {
            expect(logger.print()).to.equal('not found')
            done()
          })
        })
      })

      it('reports package version', function (done) {
        sinon.stub(util, 'pkgVersion').returns('1.2.3')
        sinon
        .stub(state, 'getBinaryPkgAsync')
        .withArgs(binaryDir)
        .resolves({
          version: 'X.Y.Z',
        })

        ;(this as any).exec(versionCommand)

        ;(process.exit as any).callsFake(() => {
          snapshot('cli version and binary version 1', logger.print(), { allowSharedSnapshot: true })
          done()
        })
      })

      it('reports package and binary message', function (done) {
        sinon.stub(util, 'pkgVersion').returns('1.2.3')
        sinon.stub(state, 'getBinaryPkgAsync').resolves({ version: 'X.Y.Z' })

        ;(this as any).exec(versionCommand)

        ;(process.exit as any).callsFake(() => {
          snapshot('cli version and binary version 2', logger.print(), { allowSharedSnapshot: true })
          done()
        })
      })

      it('reports electron and node message', function (done) {
        sinon.stub(util, 'pkgVersion').returns('1.2.3')
        sinon.stub(state, 'getBinaryPkgAsync').resolves({
          version: 'X.Y.Z',
          electronVersion: '10.10.88',
          electronNodeVersion: '11.10.3',
        })

        ;(this as any).exec(versionCommand)

        ;(process.exit as any).callsFake(() => {
          snapshot('cli version with electron and node 1', logger.print(), { allowSharedSnapshot: true })
          done()
        })
      })

      it('reports package and binary message with npm log silent', function (done) {
        restoreEnv = mockedEnv({
          npm_config_loglevel: 'silent',
        })

        sinon.stub(util, 'pkgVersion').returns('1.2.3')
        sinon.stub(state, 'getBinaryPkgAsync').resolves({ version: 'X.Y.Z' })

        ;(this as any).exec(versionCommand)

        ;(process.exit as any).callsFake(() => {
          // should not be empty!
          snapshot('cli version and binary version with npm log silent', logger.print(), { allowSharedSnapshot: true })
          done()
        })
      })

      it('reports package and binary message with npm log warn', function (done) {
        restoreEnv = mockedEnv({
          npm_config_loglevel: 'warn',
        })

        sinon.stub(util, 'pkgVersion').returns('1.2.3')
        sinon.stub(state, 'getBinaryPkgAsync').resolves({
          version: 'X.Y.Z',
        })

        ;(this as any).exec(versionCommand)

        ;(process.exit as any).callsFake(() => {
        // should not be empty!
          snapshot('cli version and binary version with npm log warn', logger.print(), { allowSharedSnapshot: true })
          done()
        })
      })

      it('handles non-existent binary', function (done) {
        sinon.stub(util, 'pkgVersion').returns('1.2.3')
        sinon.stub(state, 'getBinaryPkgAsync').resolves(null)

        ;(this as any).exec(versionCommand)

        ;(process.exit as any).callsFake(() => {
          snapshot('cli version no binary version 1', logger.print(), { allowSharedSnapshot: true })
          done()
        })
      })
    })
  })

  context('cypress run', () => {
    beforeEach((): void => {
      sinon.stub(run, 'start').resolves(0)
      sinon.stub(util, 'exit').withArgs(0)
    })

    it('calls run.start with options + exits with code', function (done) {
      // @ts-expect-error
      run.start.resolves(10)

      ;(this as any).exec('run')

      // @ts-expect-error
      util.exit.callsFake((code: number) => {
        expect(code).to.eq(10)
        done()
      })
    })

    it('run.start with options + catches errors', function (done) {
      const err = new Error('foo')

      // @ts-expect-error
      run.start.rejects(err)

      ;(this as any).exec('run')

      // @ts-expect-error
      util.logErrorExit1.callsFake((e: Error) => {
        expect(e).to.eq(err)
        done()
      })
    })

    it('calls run with port', function (): void {
      (this as any).exec('run --port 7878')
      expect(run.start).to.be.calledWith({ port: '7878' })
    })

    it('calls run with port with -p arg', function (): void {
      (this as any).exec('run -p 8989')
      expect(run.start).to.be.calledWith({ port: '8989' })
    })

    it('calls run with env variables', function (): void {
      (this as any).exec('run --env foo=bar,host=http://localhost:8888')
      expect(run.start).to.be.calledWith({
        env: 'foo=bar,host=http://localhost:8888',
      })
    })

    it('calls run with config', function (): void {
      (this as any).exec('run --config watchForFileChanges=false,baseUrl=localhost')
      expect(run.start).to.be.calledWith({
        config: 'watchForFileChanges=false,baseUrl=localhost',
      })
    })

    it('calls run with key', function (): void {
      (this as any).exec('run --key asdf')
      expect(run.start).to.be.calledWith({ key: 'asdf' })
    })

    it('calls run with --record', function (): void {
      (this as any).exec('run --record')
      expect(run.start).to.be.calledWith({ record: true })
    })

    it('calls run with --record false', function (): void {
      (this as any).exec('run --record false')
      expect(run.start).to.be.calledWith({ record: false })
    })

    it('calls run with relative --project folder', function (): void {
      (this as any).exec('run --project foo/bar')
      expect(run.start).to.be.calledWith({ project: 'foo/bar' })
    })

    it('calls run with absolute --project folder', function (): void {
      (this as any).exec('run --project /tmp/foo/bar')
      expect(run.start).to.be.calledWith({ project: '/tmp/foo/bar' })
    })

    it('calls run with headed', function (): void {
      (this as any).exec('run --headed')
      expect(run.start).to.be.calledWith({ headed: true })
    })

    it('calls run with --no-exit', function (): void {
      (this as any).exec('run --no-exit')
      expect(run.start).to.be.calledWith({ exit: false })
    })

    it('calls run with --parallel', function (): void {
      (this as any).exec('run --parallel')
      expect(run.start).to.be.calledWith({ parallel: true })
    })

    it('calls run with --ci-build-id', function (): void {
      (this as any).exec('run --ci-build-id 123')
      expect(run.start).to.be.calledWith({ ciBuildId: '123' })
    })

    it('calls run with --group', function (): void {
      (this as any).exec('run --group staging')
      expect(run.start).to.be.calledWith({ group: 'staging' })
    })

    it('calls run with spec', function (): void {
      (this as any).exec('run --spec cypress/integration/foo_spec.js')
      expect(run.start).to.be.calledWith({
        spec: 'cypress/integration/foo_spec.js',
      })
    })

    it('calls run with space-separated --spec', function (): void {
      (this as any).exec('run --spec a b c d e f g')
      expect(run.start).to.be.calledWith({ spec: 'a,b,c,d,e,f,g' })

      ;(this as any).exec('run --dev bang --spec foo bar baz -P ./')
      expect(run.start).to.be.calledWithMatch({ spec: 'foo,bar,baz' })
    })

    it('warns with space-separated --spec', function (done) {
      sinon.spy(logger, 'warn')

      ;(this as any).exec('run --spec a b c d e f g --dev')
      snapshot(logger.warn.getCall(0).args[0])
      done()
    })

    it('calls run with --tag', function (): void {
      (this as any).exec('run --tag nightly')
      expect(run.start).to.be.calledWith({ tag: 'nightly' })
    })

    it('calls run comma-separated --tag', function (): void {
      (this as any).exec('run --tag nightly,staging')
      expect(run.start).to.be.calledWith({ tag: 'nightly,staging' })
    })

    it('does not remove double quotes from --tag', function (): void {
      // I think it is a good idea to lock down this behavior
      // to make sure we either preserve it or change it in the future
      (this as any).exec('run --tag "nightly"')
      expect(run.start).to.be.calledWith({ tag: '"nightly"' })
    })

    it('calls run comma-separated --spec', function (): void {
      (this as any).exec('run --spec main_spec.js,view_spec.js')
      expect(run.start).to.be.calledWith({ spec: 'main_spec.js,view_spec.js' })
    })

    it('calls run with space-separated --tag', function (): void {
      (this as any).exec('run --tag a b c d e f g')
      expect(run.start).to.be.calledWith({ tag: 'a,b,c,d,e,f,g' })

      ;(this as any).exec('run --dev bang --tag foo bar baz -P ./')
      expect(run.start).to.be.calledWithMatch({ tag: 'foo,bar,baz' })
    })

    it('warns with space-separated --tag', function (done) {
      sinon.spy(logger, 'warn')

      ;(this as any).exec('run --tag a b c d e f g --dev')
      snapshot(logger.warn.getCall(0).args[0])
      done()
    })

    it('calls run with space-separated --tag and --spec', function (): void {
      (this as any).exec('run --tag a b c d e f g --spec h i j k l')
      expect(run.start).to.be.calledWith({ tag: 'a,b,c,d,e,f,g', spec: 'h,i,j,k,l' })

      ;(this as any).exec('run --dev bang --tag foo bar baz -P ./ --spec fizz buzz --headed false')
      expect(run.start).to.be.calledWithMatch({ tag: 'foo,bar,baz', spec: 'fizz,buzz' })
    })

    it('removes stray double quotes from --ci-build-id and --group', function (): void {
      (this as any).exec('run --ci-build-id "123" --group "staging"')
      expect(run.start).to.be.calledWith({ ciBuildId: '123', group: 'staging' })
    })

    it('calls run with --auto-cancel-after-failures', function (): void {
      (this as any).exec('run --auto-cancel-after-failures 4')
      expect(run.start).to.be.calledWith({ autoCancelAfterFailures: '4' })
    })

    it('calls run with --auto-cancel-after-failures with false', function (): void {
      (this as any).exec('run --auto-cancel-after-failures false')
      expect(run.start).to.be.calledWith({ autoCancelAfterFailures: 'false' })
    })

    it('calls run with --runner-ui', function (): void {
      (this as any).exec('run --runner-ui')
      expect(run.start).to.be.calledWith({ runnerUi: true })
    })

    it('calls run with --no-runner-ui', function (): void {
      (this as any).exec('run --no-runner-ui')
      expect(run.start).to.be.calledWith({ runnerUi: false })
    })
  })

  context('cypress open', () => {
    beforeEach((): void => {
      sinon.stub(open, 'start').resolves(0)
    })

    it('calls open.start with relative --project folder', function (): void {
      (this as any).exec('open --project foo/bar')
      expect(open.start).to.be.calledWith({ project: 'foo/bar' })
    })

    it('calls open.start with absolute --project folder', function (): void {
      (this as any).exec('open --project /tmp/foo/bar')
      expect(open.start).to.be.calledWith({ project: '/tmp/foo/bar' })
    })

    it('calls open.start with options', function (): void {
      // sinon.stub(open, 'start').resolves()
      (this as any).exec('open --port 7878')
      expect(open.start).to.be.calledWith({ port: '7878' })
    })

    it('calls open.start with global', function (): void {
      // sinon.stub(open, 'start').resolves()
      (this as any).exec('open --port 7878 --global')
      expect(open.start).to.be.calledWith({ port: '7878', global: true })
    })

    it('calls open.start + catches errors', function (done) {
      const err = new Error('foo')

      // @ts-expect-error
      open.start.rejects(err)

      ;(this as any).exec('open --port 7878')

      // @ts-expect-error
      util.logErrorExit1.callsFake((e: Error) => {
        expect(e).to.eq(err)
        done()
      })
    })
  })

  context('cypress install', () => {
    it('calls install.start without forcing', function (): void {
      sinon.stub(install, 'start').resolves()

      ;(this as any).exec('install')
      expect(install.start).not.to.be.calledWith({ force: true })
    })

    it('calls install.start with force: true when passed', function (): void {
      sinon.stub(install, 'start').resolves()

      ;(this as any).exec('install --force')
      expect(install.start).to.be.calledWith({ force: true })
    })

    it('install calls install.start + catches errors', function (done) {
      const err = new Error('foo')

      sinon.stub(install, 'start').rejects(err)

      ;(this as any).exec('install')

      // @ts-expect-error
      util.logErrorExit1.callsFake((e: Error) => {
        expect(e).to.eq(err)
        done()
      })
    })
  })

  context('cypress verify', () => {
    it('verify calls verify.start with force: true', function (): void {
      sinon.stub(verify, 'start').resolves()

      ;(this as any).exec('verify')
      expect(verify.start).to.be.calledWith({
        force: true,
        welcomeMessage: false,
      })
    })

    it('verify calls verify.start + catches errors', function (done) {
      const err = new Error('foo')

      sinon.stub(verify, 'start').rejects(err)

      ;(this as any).exec('verify')

      // @ts-expect-error
      util.logErrorExit1.callsFake((e: Error) => {
        expect(e).to.eq(err)
        done()
      })
    })
  })

  context('cypress info', () => {
    beforeEach((): void => {
      sinon.stub(info, 'start').resolves(0)
      sinon.stub(util, 'exit').withArgs(0)
    })

    it('calls info start', function (): void {
      (this as any).exec('info')
      expect(info.start).to.have.been.calledWith()
    })
  })

  context('cypress cache list', () => {
    it('prints explanation when no cache', function (done) {
      const err: any = new Error()

      err.code = 'ENOENT'

      sinon.stub(cache, 'list').rejects(err)

      ;(this as any).exec('cache list')

      ;(process.exit as any).callsFake(() => {
        snapshot('prints explanation when no cache', logger.print())
        done()
      })
    })

    it('catches rejection and exits', function (done) {
      const err = new Error('cache list failed badly')

      sinon.stub(cache, 'list').rejects(err)

      ;(this as any).exec('cache list')

      // @ts-expect-error
      util.logErrorExit1.callsFake((e: Error) => {
        expect(e).to.eq(err)
        done()
      })
    })
  })

  context('component-testing', () => {
    beforeEach((): void => {
      sinon.stub(spawn, 'start').resolves()
    })

    it('spawns server with correct args for component-testing', function (): void {
      (this as any).exec('open --component --dev')
      // @ts-expect-error
      expect(spawn.start.firstCall.args[0]).to.include('--testing-type')
      // @ts-expect-error
      expect(spawn.start.firstCall.args[0]).to.include('component')
    })

    it('runs server with correct args for component-testing', function (): void {
      (this as any).exec('run --component --dev')
      // @ts-expect-error
      expect(spawn.start.firstCall.args[0]).to.include('--testing-type')
      // @ts-expect-error
      expect(spawn.start.firstCall.args[0]).to.include('component')
    })
  })
})
