require('../spec_helper')

const os = require('os')
const { errors, formError, formErrorText } = require('../../lib/errors')
const snapshot = require('snap-shot-it')
const { omit } = require('ramda')

describe('errors', function () {
  const { missingXvfb } = errors

  beforeEach(function () {
    this.sandbox.stub(os, 'platform').returns('test platform')
    this.sandbox.stub(os, 'release').returns('test release')
  })

  describe('individual', () => {
    it('has the following errors', () =>
      snapshot(Object.keys(errors))
    )

    context('#missingXvfb', function () {
      it('is an error information object', () => {
        snapshot(missingXvfb)
      })
    })
  })

  context('#formError', function () {
    const withoutStack = omit(['stack'])
    it('adds platform info to error', () =>
      // error.stack is too test platform specific
      snapshot(formError(missingXvfb, withoutStack(new Error('test error'))))
    )
  })

  context('#formErrorText', function () {
    it('returns fully formed text message', () =>
      snapshot(formErrorText(missingXvfb, new Error('test error')))
    )
  })
})
