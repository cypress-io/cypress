require('../../spec_helper')

const os = require('os')
const path = require('path')
const snapshot = require('../../support/snapshot')
const cp = require('child_process')

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

  // NOTE: hmm, running this test for some reason breaks 4 tests in verify_spec.js with very weird errors
  context.skip('on linux', () => {
    beforeEach(() => {
      os.platform.returns('linux')
    })

    it('can try unzip first then fall back to node unzip', function () {
      sinon.stub(unzip.utils.unzipTools, 'extract').resolves()

      const unzipChildProcess = {
        on: sinon.stub(),
        stdout: {
          on () {},
        },
        stderr: {
          on () {},
        },
      }

      unzipChildProcess.on.withArgs('error').yieldsAsync(0)
      unzipChildProcess.on.withArgs('close').yieldsAsync(0)
      sinon.stub(cp, 'spawn').withArgs('unzip').returns(unzipChildProcess)

      const zipFilePath = path.join('test', 'fixture', 'example.zip')

      return unzip
      .start({
        zipFilePath,
        installDir,
      })
      .then(() => {
        expect(cp.spawn).to.have.been.calledWith('unzip')
        expect(unzip.utils.unzipTools.extract).to.be.calledWith(zipFilePath)
      })
    })
  })
})
