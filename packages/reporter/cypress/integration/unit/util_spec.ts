import { getFilenameParts } from '../../../src/lib/util'

const compare = (filename, array) => {
  expect(getFilenameParts(filename)).to.deep.equal(array)
}

describe('utils', () => {
  context('getFilenameParts', () => {
    it('splits basic filenames', () => {
      compare('basic.spec.ts', ['basic', '.spec.ts'])
      compare('something.foo.ts', ['something', '.foo.ts'])
      compare('first-user.js', ['first-user', '.js'])
    })

    it('handles multiple extensions', () => {
      compare('spies_stubs_clocks.spec.js', ['spies_stubs_clocks', '.spec.js'])
      compare('newIssuanceWorkflow.test.js', ['newIssuanceWorkflow', '.test.js'])
      compare('Button.cy.js', ['Button', '.cy.js'])
    })

    it('handles _spec', () => {
      compare('warning_spec.js', ['warning', '_spec.js'])
    })

    it('ignores early _spec', () => {
      compare('header_spec_viz.js', ['header_spec_viz', '.js'])
    })

    it('behaves as expected if "spec" is in the filename', () => {
      compare('spec.ts', ['spec', '.ts'])
      compare('spec_spec.ts', ['spec', '_spec.ts'])
    })

    it('handles no file extension', () => {
      compare('no-extension', ['no-extension', ''])
    })

    it('strips directory path', () => {
      compare('unit/spec_split_spec.ts', ['spec_split', '_spec.ts'])
    })
  })
})
