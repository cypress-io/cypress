require('../spec_helper')

const os = require('os')
const snapshot = require('snap-shot-it')
const { errors, formErrorText } = require(`${lib}/errors`)
const util = require(`${lib}/util`)

describe('errors', function () {
  const { missingXvfb } = errors

  beforeEach(function () {
    sinon.stub(util, 'pkgVersion').returns('1.2.3')
    os.platform.returns('test platform')
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
