import { formatDuration, getFilenameParts } from '../../../src/lib/util'

const compare = (filename, array) => {
  expect(getFilenameParts(filename)).to.deep.equal(array)
}

describe('utils', () => {
  context('formatDuration', () => {
    it('formats no time', () => {
      expect(formatDuration(0)).to.equal('--')
    })

    it('formats time of <1s', () => {
      expect(formatDuration(1)).to.equal('1ms')
      expect(formatDuration(999)).to.equal('999ms')
    })

    it('formats time of >=1s', () => {
      expect(formatDuration(1000)).to.equal('00:01')
      expect(formatDuration(1400)).to.equal('00:01')
      expect(formatDuration(35620)).to.equal('00:36')
      expect(formatDuration(59200)).to.equal('00:59')
    })

    it('formats time of >=1m', () => {
      expect(formatDuration(60000)).to.equal('01:00')
      expect(formatDuration(600000)).to.equal('10:00')
      expect(formatDuration(3599000)).to.equal('59:59')
    })

    it('formats time of >=1h', () => {
      expect(formatDuration(3600000)).to.equal('1:00:00')
      expect(formatDuration(4200000)).to.equal('1:10:00')
      expect(formatDuration(7199000)).to.equal('1:59:59')
    })

    it('displays larger times in hours', () => {
      expect(formatDuration(360000000)).to.equal('100:00:00')
    })
  })

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
      compare('cypress/integration/meta_&%.cy.ts', ['meta_&%', '.cy.ts'])
    })

    it('handles an unexpected number of extensions', () => {
      compare('reporter.hooks.spec.js', ['reporter.hooks', '.spec.js'])
    })
  })
})
