require('../../spec_helper')

const events = require('events')
const os = require('os')
const path = require('path')
const snapshot = require('../../support/snapshot')
const cp = require('child_process')
const debug = require('debug')('test')
const readline = require('readline')

const fs = require(`${lib}/fs`)
const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const unzip = require(`${lib}/tasks/unzip`)

const stdout = require('../../support/stdout')
const normalize = require('../../support/normalize')

const version = '1.2.3'
const installDir = path.join(os.tmpdir(), 'Cypress', version)

describe('lib/tasks/unzip', function () {
  require('mocha-banner').register()
  beforeEach(function () {
    this.stdout = stdout.capture()

    os.platform.returns('darwin')
    sinon.stub(util, 'pkgVersion').returns(version)
  })

  afterEach(function () {
    stdout.restore()

    // return fs.removeAsync(installationDir)
  })

  it('throws when cannot unzip', function () {
    const ctx = this

    return unzip
    .start({
      zipFilePath: path.join('test', 'fixture', 'bad_example.zip'),
      installDir,
    })
    .then(() => {
      throw new Error('should have failed')
    })
    .catch((err) => {
      logger.error(err)

      snapshot('unzip error 1', normalize(ctx.stdout.toString()))
    })
  })

  it('can really unzip', function () {
    const onProgress = sinon.stub().returns(undefined)

    return unzip
    .start({
      zipFilePath: path.join('test', 'fixture', 'example.zip'),
      installDir,
      progress: { onProgress },
    })
    .then(() => {
      expect(onProgress).to.be.called

      return fs.statAsync(installDir)
    })
  })

  context('on linux', () => {
    beforeEach(() => {
      os.platform.returns('linux')
    })

    it('can try unzip first then fall back to node unzip', function (done) {
      const zipFilePath = path.join('test', 'fixture', 'example.zip')

      sinon.stub(unzip.utils.unzipTools, 'extract').callsFake((filePath, opts, cb) => {
        debug('unzip extract called with %s', filePath)
        expect(filePath, 'zipfile is the same').to.equal(zipFilePath)
        expect(cb, 'has callback').to.be.a('function')
        setTimeout(cb, 10)
      })

      const unzipChildProcess = new events.EventEmitter()

      unzipChildProcess.stdout = {
        on () {},
      }

      unzipChildProcess.stderr = {
        on () {},
      }

      sinon.stub(cp, 'spawn').withArgs('unzip').returns(unzipChildProcess)

      setTimeout(() => {
        debug('emitting unzip error')
        unzipChildProcess.emit('error', new Error('unzip fails badly'))
      }, 100)

      unzip
      .start({
        zipFilePath,
        installDir,
      })
      .then(() => {
        debug('checking if unzip was called')
        expect(cp.spawn, 'unzip spawn').to.have.been.calledWith('unzip')
        expect(unzip.utils.unzipTools.extract, 'extract called').to.be.calledWith(zipFilePath)
        expect(unzip.utils.unzipTools.extract, 'extract called once').to.be.calledOnce
        done()
      })
    })

    it('calls node unzip just once', function (done) {
      const zipFilePath = path.join('test', 'fixture', 'example.zip')

      sinon.stub(unzip.utils.unzipTools, 'extract').callsFake((filePath, opts, cb) => {
        debug('unzip extract called with %s', filePath)
        expect(filePath, 'zipfile is the same').to.equal(zipFilePath)
        expect(cb, 'has callback').to.be.a('function')
        setTimeout(cb, 10)
      })

      const unzipChildProcess = new events.EventEmitter()

      unzipChildProcess.stdout = {
        on () {},
      }

      unzipChildProcess.stderr = {
        on () {},
      }

      sinon.stub(cp, 'spawn').withArgs('unzip').returns(unzipChildProcess)

      setTimeout(() => {
        debug('emitting unzip error')
        unzipChildProcess.emit('error', new Error('unzip fails badly'))
      }, 100)

      setTimeout(() => {
        debug('emitting unzip close')
        unzipChildProcess.emit('close', 1)
      }, 110)

      unzip
      .start({
        zipFilePath,
        installDir,
      })
      .then(() => {
        debug('checking if unzip was called')
        expect(cp.spawn, 'unzip spawn').to.have.been.calledWith('unzip')
        expect(unzip.utils.unzipTools.extract, 'extract called').to.be.calledWith(zipFilePath)
        expect(unzip.utils.unzipTools.extract, 'extract called once').to.be.calledOnce
        done()
      })
    })
  })

  context('on Mac', () => {
    beforeEach(() => {
      os.platform.returns('darwin')
    })

    it('calls node unzip just once', function (done) {
      const zipFilePath = path.join('test', 'fixture', 'example.zip')

      sinon.stub(unzip.utils.unzipTools, 'extract').callsFake((filePath, opts, cb) => {
        debug('unzip extract called with %s', filePath)
        expect(filePath, 'zipfile is the same').to.equal(zipFilePath)
        expect(cb, 'has callback').to.be.a('function')
        setTimeout(cb, 10)
      })

      const unzipChildProcess = new events.EventEmitter()

      unzipChildProcess.stdout = {
        on () {},
      }

      unzipChildProcess.stderr = {
        on () {},
      }

      sinon.stub(cp, 'spawn').withArgs('ditto').returns(unzipChildProcess)
      sinon.stub(readline, 'createInterface').returns({
        on: () => {},
      })

      setTimeout(() => {
        debug('emitting ditto error')
        unzipChildProcess.emit('error', new Error('ditto fails badly'))
      }, 100)

      setTimeout(() => {
        debug('emitting ditto close')
        unzipChildProcess.emit('close', 1)
      }, 110)

      unzip
      .start({
        zipFilePath,
        installDir,
      })
      .then(() => {
        debug('checking if unzip was called')
        expect(cp.spawn, 'unzip spawn').to.have.been.calledWith('ditto')
        expect(unzip.utils.unzipTools.extract, 'extract called').to.be.calledWith(zipFilePath)
        expect(unzip.utils.unzipTools.extract, 'extract called once').to.be.calledOnce
        done()
      })
    })
  })
})
