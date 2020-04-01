/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const LimitedMap = require('../../../../src/util/limited_map')

const {
  _,
} = Cypress
const $utils = Cypress.utils

const stackWithoutMessage = (err) => err.stack.replace(`${err.toString()}\n`, '')

describe('driver/src/cypress/utils', function () {
  context('.reduceProps', () => {
    return it('reduces obj to only include props in props', () => {
      let obj = {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz',
      }

      obj = $utils.reduceProps(obj, ['foo', 'bar'])

      return expect(obj).to.deep.eq({ foo: 'foo', bar: 'bar' })
    })
  })

  context('.filterOutOptions', () => {
    it('returns new obj based on the delta from the filter', () => {
      const obj = $utils.filterOutOptions({ visible: true, exist: false, foo: 'bar' }, { visible: null, exist: false })

      return expect(obj).to.deep.eq({ visible: true })
    })

    it('returns undefined if nothing is different', () => {
      const obj = $utils.filterOutOptions({ foo: 'foo', bar: 'bar' }, { foo: 'foo' })

      return expect(obj).to.be.undefined
    })

    return it('normalizes objects with length property', () => {
      const obj = $utils.filterOutOptions({ exist: true }, { visible: null, exist: false, length: null })

      return expect(obj).to.deep.eq({ exist: true })
    })
  })

  context('.stringify', function () {
    beforeEach(function () {
      this.str = (str) => $utils.stringify(str)
    })

    context('Values', function () {
      it('string', function () {
        return expect(this.str('foo bar baz')).to.eq('foo bar baz')
      })

      it('number', function () {
        return expect(this.str(1234)).to.eq('1234')
      })

      it('null', function () {
        return expect(this.str(null)).to.eq('null')
      })

      // QUESTION: is this really the behavior we want? wouldn't 'undefined' be better?
      it('undefined', function () {
        return expect(this.str(undefined)).to.eq('')
      })

      return it('symbol', function () {
        return expect(this.str(Symbol.iterator)).to.eq('Symbol')
      })
    })

    context('Arrays', function () {
      it('length <= 3', function () {
        const a = [['one', 2, 'three']]

        return expect(this.str(a)).to.eq('[one, 2, three]')
      })

      return it('length > 3', function () {
        const a = [[1, 2, 3, 4, 5]]

        return expect(this.str(a)).to.eq('Array[5]')
      })
    })

    context('Objects', function () {
      it('keys <= 2', function () {
        const o = { visible: null, exists: true }

        return expect(this.str(o)).to.eq('{visible: null, exists: true}')
      })

      it('keys > 2', function () {
        const o = { foo: 'foo', bar: 'baz', baz: 'baz' }

        return expect(this.str(o)).to.eq('Object{3}')
      })

      return it('can have length property', function () {
        const o = { length: 10, foo: 'bar' }

        return expect(this.str(o)).to.eq('{foo: bar, length: 10}')
      })
    })

    context('Functions', () => {
      return it('function(){}', function () {
        const o = function (foo, bar, baz) {}

        return expect(this.str(o)).to.eq('function(){}')
      })
    })

    return context('Elements', () => {
      return it('stringifyElement', () => {
        return cy.visit('/fixtures/dom.html').then(function () {
          const o = Cypress.$('#dom')

          return expect(this.str(o)).to.eq('<div#dom>')
        })
      })
    })
  })

  return context('.memoize', () => {
    it('runs the function the first time', () => {
      const fn = cy.stub().returns('output')
      const memoizedFn = $utils.memoize(fn)
      const result = memoizedFn('input')

      expect(fn).to.be.calledWith('input')

      return expect(result).to.equal('output')
    })

    it('runs the function for unique first arguments', () => {
      const fn = cy.stub().returns('output')
      const memoizedFn = $utils.memoize(fn)
      const result1 = memoizedFn('input-1')
      const result2 = memoizedFn('input-2')

      expect(fn).to.be.calledWith('input-1')
      expect(fn).to.be.calledWith('input-2')
      expect(fn).to.be.calledTwice
      expect(result1).to.equal('output')

      return expect(result2).to.equal('output')
    })

    it('returns cached return value if first argument is the same', () => {
      const fn = cy.stub().returns('output')
      const memoizedFn = $utils.memoize(fn)
      const result1 = memoizedFn('input')
      const result2 = memoizedFn('input')

      expect(fn).to.be.calledWith('input')
      expect(fn).to.be.calledOnce
      expect(result1).to.equal('output')

      return expect(result2).to.equal('output')
    })

    return it('accepts a cache instance to use as the second argument', () => {
      const fn = cy.stub().returns('output')
      // LimitedMap(2) only holds on to 2 items at a time and clears older ones
      const memoizedFn = $utils.memoize(fn, new LimitedMap(2))

      memoizedFn('input-1')
      memoizedFn('input-2')
      expect(fn).to.be.calledTwice
      memoizedFn('input-3')
      expect(fn).to.be.calledThrice
      memoizedFn('input-1')

      // cache for input-1 is cleared, so it calls the function again
      return expect(fn.callCount).to.be.equal(4)
    })
  })
})
