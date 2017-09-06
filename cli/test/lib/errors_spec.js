require('../spec_helper')

const os = require('os')
const snapshot = require('snap-shot-it')
const { errors, formErrorText } = require(`${lib}/errors`)
const util = require(`${lib}/util`)

describe('errors', function () {
  const { missingXvfb } = errors

  beforeEach(function () {
    this.sandbox.stub(util, 'pkgVersion').returns('1.2.3')
    this.sandbox.stub(os, 'platform').returns('test platform')
    this.sandbox.stub(os, 'release').returns('test release')
  })

  describe('individual', () => {
    it('has the following errors', () =>
      snapshot(Object.keys(errors))
    )
  })

  context('.errors.formErrorText', function () {
    it('returns fully formed text message', () =>
      snapshot(formErrorText(missingXvfb))
    )
  })
})
