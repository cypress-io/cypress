require('../spec_helper')

const os = require('os')
const snapshot = require('../support/snapshot')
const { errors, formErrorText } = require(`${lib}/errors`)
const util = require(`${lib}/util`)

describe('errors', function () {
  const { missingXvfb } = errors

  beforeEach(function () {
    sinon.stub(util, 'pkgVersion').returns('1.2.3')
    os.platform.returns('test platform')
  })

  describe('individual', () => {
    it('has the following errors', () => {
      return snapshot(Object.keys(errors).sort())
    })
  })

  context('.errors.formErrorText', function () {
    it('returns fully formed text message', () => {
      expect(missingXvfb).to.be.an('object')

      return formErrorText(missingXvfb)
      .then((text) => {
        expect(text).to.be.a('string')
        snapshot(text)
      })
    })

    it('calls solution if a function', () => {
      const solution = sinon.stub().returns('a solution')
      const error = {
        description: 'description',
        solution,
      }

      return formErrorText(error)
      .then((text) => {
        snapshot(text)
        expect(solution).to.have.been.calledOnce
      })
    })

    it('passes message and previous message', () => {
      const solution = sinon.stub().returns('a solution')
      const error = {
        description: 'description',
        solution,
      }

      return formErrorText(error, 'msg', 'prevMsg')
      .then(() => {
        expect(solution).to.have.been.calledWithExactly('msg', 'prevMsg')
      })
    })

    it('expects solution to be a string', () => {
      const error = {
        description: 'description',
        solution: 42,
      }

      return expect(formErrorText(error)).to.be.rejected
    })

    it('forms full text for invalid display error', () => {
      return formErrorText(errors.invalidDisplayError, 'current message', 'prev message')
      .then((text) => {
        snapshot('invalid display error', text)
      })
    })
  })
})
