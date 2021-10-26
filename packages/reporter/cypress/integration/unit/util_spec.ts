import { getFilenameParts } from '../../../src/lib/util'

const compare = (filename, array) => {
  expect(getFilenameParts(filename)).to.deep.equal(array)
}

describe('utils', () => {
  context('getFilenameParts', () => {
    it('splits basic filenames', () => {
      compare('something.foo.ts', ['something.foo', '.ts'])
      compare('first-user.js', ['first-user', '.js'])
      compare('model.coffee', ['model', '.coffee'])
    })

    it('handles .spec, .test, and .cy', () => {
      compare('basic.spec.ts', ['basic', '.spec.ts'])
      compare('spies_stubs_clocks.spec.js', ['spies_stubs_clocks', '.spec.js'])
      compare('newIssuanceWorkflow.test.js', ['newIssuanceWorkflow', '.test.js'])
      compare('Button.cy.js', ['Button', '.cy.js'])
    })

    it('does not consider "_spec" to be part of the extension', () => {
      // might want to change this functionality later, but for now this is working as intended
      compare('warning_spec.js', ['warning_spec', '.js'])
    })

    it('behaves as expected if "spec" is in the filename', () => {
      compare('spec.ts', ['spec', '.ts'])
      compare('spec_spec.ts', ['spec_spec', '.ts'])
    })

    it('handles no file extension', () => {
      compare('no-extension', ['no-extension', ''])
    })

    it('strips directory path', () => {
      compare('unit/spec_split_spec.ts', ['spec_split_spec', '.ts'])
      compare('dir/unit/spec_split_spec.ts', ['spec_split_spec', '.ts'])
    })

    it('displays filename with special characters', () => {
      compare('cypress/integration/meta_&%_spec.ts', ['meta_&%_spec', '.ts'])
    })

    it('handles an unexpected number of extensions', () => {
      compare('reporter.hooks.spec.js', ['reporter.hooks', '.spec.js'])
    })
  })
})
