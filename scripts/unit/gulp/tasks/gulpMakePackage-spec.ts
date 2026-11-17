import { expect } from 'chai'
import sinon from 'sinon'

const proxyquire = require('proxyquire').noCallThru()

describe('gulpMakePackage', () => {
  context('packageName validation', () => {
    let validate: (val: string) => boolean

    before(async () => {
      const prompt = sinon.stub().rejects(new Error('stop after prompting'))
      const { makePackage } = proxyquire('../../../gulp/tasks/gulpMakePackage', {
        inquirer: { prompt },
      })

      const err = await makePackage().catch((e: Error) => e)

      expect(err).to.have.property('message', 'stop after prompting')

      validate = prompt.firstCall.args[0].find(({ name }) => name === 'packageName').validate
    })

    it('accepts lowercase, uppercase, mixed case and hyphenated names', () => {
      expect(validate('my-package')).to.be.true
      expect(validate('ABC')).to.be.true
      expect(validate('MyPackage')).to.be.true
    })

    it('rejects names with no letters or hyphens', () => {
      expect(validate('')).to.be.false
      expect(validate('123')).to.be.false
    })

    it('rejects the punctuation that sits between Z and a in ASCII', () => {
      expect(validate('_')).to.be.false
      expect(validate('[]^`')).to.be.false
    })
  })
})
