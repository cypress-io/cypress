import { expect } from 'chai'
import sinon from 'sinon'

const proxyquire = require('proxyquire').noCallThru()

describe('gulpMakePackage', () => {
  context('packageName validation', () => {
    let validate: (val: string) => true | string

    before(async () => {
      const prompt = sinon.stub().rejects(new Error('stop after prompting'))
      const { makePackage } = proxyquire('../../../gulp/tasks/gulpMakePackage', {
        inquirer: { prompt },
      })

      const err = await makePackage().catch((e: Error) => e)

      expect(err).to.have.property('message', 'stop after prompting')

      validate = prompt.firstCall.args[0].find(({ name }) => name === 'packageName').validate
    })

    it('accepts valid package names', () => {
      for (const name of ['server', 'data-context', 'v8-snapshot-require', 'network-interception', 'ts']) {
        expect(validate(name), name).to.be.true
      }
    })

    it('accepts digits after the first character', () => {
      expect(validate('http2-proxy')).to.be.true
      expect(validate('es6')).to.be.true
    })

    it('rejects a name with spaces or punctuation', () => {
      for (const name of ['my package', 'my package!', 'my_package', 'my.package', 'scope/name', 'a[]^`']) {
        expect(validate(name), name).to.be.a('string').that.includes('lowercase letters, digits and single hyphens')
      }
    })

    it('rejects uppercase letters', () => {
      for (const name of ['ABC', 'MyPackage', 'my-Package']) {
        expect(validate(name), name).to.be.a('string').that.includes('lowercase')
      }
    })

    it('rejects a name that does not start with a letter', () => {
      for (const name of ['1-', '8-ball', '-package', '-', '@@@a']) {
        expect(validate(name), name).to.be.a('string').that.includes('start with a letter')
      }
    })

    it('rejects a trailing or doubled hyphen', () => {
      for (const name of ['my-', 'my--package']) {
        expect(validate(name), name).to.be.a('string').that.includes('single hyphens')
      }
    })

    it('rejects an empty name', () => {
      expect(validate('')).to.be.a('string').that.includes('start with a letter')
    })

    it('rejects a name that makes @packages/<name> longer than npm\'s 214-character limit', () => {
      const longestName = 'a'.repeat(214 - '@packages/'.length)

      expect(validate(longestName)).to.be.true
      expect(validate(`${longestName}a`)).to.be.a('string').that.includes('214-character limit')
    })
  })
})
