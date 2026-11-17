import { expect } from 'chai'
import { WarningsProcessor, WarningConsequence } from '../../src/doctor/warnings-processor'

const consequenceOf = (err: Error) => {
  const processor = new WarningsProcessor('/project')
  const warning = processor.warningFromError(err, 'lib/module.js', {
    deferred: new Set(),
    norewrite: new Set(),
  })

  return warning?.consequence
}

describe('WarningsProcessor', () => {
  describe('consequence of a verification error', () => {
    it('does not rewrite modules that call something that is not a function', () => {
      expect(consequenceOf(new TypeError('foo.bar is not a function'))).to.equal(WarningConsequence.Norewrite)
      expect(consequenceOf(new ReferenceError('x is not a function'))).to.equal(WarningConsequence.Norewrite)
      expect(consequenceOf(new Error('x is not a function'))).to.equal(WarningConsequence.Norewrite)
    })

    it('does not rewrite modules that use a rewritten `__x__` helper before it is defined', () => {
      expect(consequenceOf(new ReferenceError('__get_foo__ is not defined'))).to.equal(WarningConsequence.Norewrite)
    })

    it('defers modules that reference a missing global', () => {
      expect(consequenceOf(new ReferenceError('Buffer is not defined'))).to.equal(WarningConsequence.Defer)
      expect(consequenceOf(new Error('process is not defined'))).to.equal(WarningConsequence.Defer)
    })

    it('defers modules that read a property of something missing', () => {
      expect(consequenceOf(new TypeError('Cannot read property \'x\' of undefined'))).to.equal(WarningConsequence.Defer)
      expect(consequenceOf(new TypeError('Cannot read properties of undefined (reading \'x\')'))).to.equal(WarningConsequence.Defer)
    })

    it('matches the error name case-insensitively', () => {
      const err = new Error('Buffer is not defined')

      err.name = 'referenceerror'
      expect(consequenceOf(err)).to.equal(WarningConsequence.Defer)

      err.name = 'TYPEERROR'
      err.message = 'foo is not a function'
      expect(consequenceOf(err)).to.equal(WarningConsequence.Norewrite)
    })

    it('has no consequence for other errors', () => {
      expect(consequenceOf(new SyntaxError('Unexpected token'))).to.equal(WarningConsequence.None)
      expect(consequenceOf(new TypeError('x is not iterable'))).to.equal(WarningConsequence.None)
      expect(consequenceOf(new RangeError('Buffer is not defined'))).to.equal(WarningConsequence.None)
      expect(consequenceOf(new RangeError('x is not a function'))).to.equal(WarningConsequence.None)
    })

    it('only matches the error name at the start of the text', () => {
      const err = new Error('wrapped: ReferenceError: Buffer is not defined')

      err.name = 'Failure'
      expect(consequenceOf(err)).to.equal(WarningConsequence.None)
    })
  })
})
