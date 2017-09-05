require('../../spec_helper')

const os = require('os')
const path = require('path')
const snapshot = require('snap-shot-it')

const fs = require(`${lib}/fs`)
const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const info = require(`${lib}/tasks/info`)
const unzip = require(`${lib}/tasks/unzip`)

const stdout = require('../../support/stdout')
const normalize = require('../../support/normalize')

const dest = info.getInstallationDir()

describe('unzip', function () {
  beforeEach(function () {
    this.stdout = stdout.capture()

    this.sandbox.stub(os, 'platform').returns('darwin')
    this.sandbox.stub(os, 'release').returns('test release')
    this.sandbox.stub(util, 'pkgVersion').returns('1.2.3')
  })

  afterEach(function () {
    stdout.restore()

    return fs.removeAsync(dest)
  })

  it('throws when cannot unzip', function () {
    const ctx = this

    return unzip.start({
      downloadDestination: path.join('test', 'fixture', 'bad_example.zip'),
      zipDestination: '/foo/bar/baz',
    })
    .then(() => {
      throw new Error('should have failed')
    })
    .catch((err) => {
      logger.error(err)

      snapshot(
        'unzip error',
        normalize(ctx.stdout.toString())
      )
    })
  })

  it('can really unzip', function () {
    return unzip.start({
      downloadDestination: path.join('test', 'fixture', 'example.zip'),
    })
    .then(() => {
      return fs.statAsync(dest)
    })
  })
})
