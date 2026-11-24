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
      for (const name of ['release-notes', 'source-maps', 'http2-proxy', 'es6']) {
        expect(validate(name), name).to.be.true
      }
    })

    it('rejects names that break the naming rule', () => {
      const invalidNames = [
        '', 'my package', 'my package!', 'my_package', 'my.package', 'scope/name', '@@@a',
        'ABC', 'MyPackage', 'my-Package',
        '1-', '8-ball', '-package', '-',
        'my-', 'my--package',
      ]

      for (const name of invalidNames) {
        expect(validate(name), name).to.be.a('string').that.includes('lowercase letters, digits and single hyphens')
      }
    })

    it('rejects the name of an existing package', () => {
      for (const name of ['server', 'ts', 'telemetry']) {
        expect(validate(name), name).to.equal(`packages/${name} already exists. Choose a different name.`)
      }
    })
  })
})
