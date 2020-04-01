import LimitedMap from '../../../../src/util/limited_map'

const $utils = Cypress.utils

describe('driver/src/cypress/utils', () => {
  context('.reduceProps', () => {
    it('reduces obj to only include props in props', () => {
      let obj = {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz',
      }

      obj = $utils.reduceProps(obj, ['foo', 'bar'])

      expect(obj).to.deep.eq({ foo: 'foo', bar: 'bar' })
    })
  })

  context('.filterOutOptions', () => {
    it('returns new obj based on the delta from the filter', () => {
      const obj = $utils.filterOutOptions({ visible: true, exist: false, foo: 'bar' }, { visible: null, exist: false })

      expect(obj).to.deep.eq({ visible: true })
    })

    it('returns undefined if nothing is different', () => {
      const obj = $utils.filterOutOptions({ foo: 'foo', bar: 'bar' }, { foo: 'foo' })

      expect(obj).to.be.undefined
    })

    it('normalizes objects with length property', () => {
      const obj = $utils.filterOutOptions({ exist: true }, { visible: null, exist: false, length: null })

      expect(obj).to.deep.eq({ exist: true })
    })
  })

  context('.stringify', () => {
    beforeEach(() => {
      this.str = (str) => $utils.stringify(str)
    })

    context('Values', () => {
      it('string', () => {
        expect(this.str('foo bar baz')).to.eq('foo bar baz')
      })

      it('number', () => {
        expect(this.str(1234)).to.eq('1234')
      })

      it('null', () => {
        expect(this.str(null)).to.eq('null')
      })

      // QUESTION: is this really the behavior we want? wouldn't 'undefined' be better?
      it('undefined', () => {
        expect(this.str(undefined)).to.eq('')
      })

      it('symbol', () => {
        expect(this.str(Symbol.iterator)).to.eq('Symbol')
      })
    })

    context('Arrays', () => {
      it('length <= 3', () => {
        const a = [['one', 2, 'three']]

        expect(this.str(a)).to.eq('[one, 2, three]')
      })

      it('length > 3', () => {
        const a = [[1, 2, 3, 4, 5]]

        expect(this.str(a)).to.eq('Array[5]')
      })
    })

    context('Objects', () => {
      it('keys <= 2', () => {
        const o = { visible: null, exists: true }

        expect(this.str(o)).to.eq('{visible: null, exists: true}')
      })

      it('keys > 2', () => {
        const o = { foo: 'foo', bar: 'baz', baz: 'baz' }

        expect(this.str(o)).to.eq('Object{3}')
      })

      it('can have length property', () => {
        const o = { length: 10, foo: 'bar' }

        expect(this.str(o)).to.eq('{foo: bar, length: 10}')
      })
    })

    context('Functions', () => {
      it('function(){}', () => {
        const o = function (foo, bar, baz) {}

        expect(this.str(o)).to.eq('function(){}')
      })
    })

    context('Elements', () => {
      it('stringifyElement', () => {
        cy.visit('/fixtures/dom.html').then(() => {
          const o = Cypress.$('#dom')

          expect(this.str(o)).to.eq('<div#dom>')
        })
      })
    })
  })

  context('.memoize', () => {
    it('runs the function the first time', () => {
      const fn = cy.stub().returns('output')
      const memoizedFn = $utils.memoize(fn)
      const result = memoizedFn('input')

      expect(fn).to.be.calledWith('input')

      expect(result).to.equal('output')
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

      expect(result2).to.equal('output')
    })

    it('returns cached return value if first argument is the same', () => {
      const fn = cy.stub().returns('output')
      const memoizedFn = $utils.memoize(fn)
      const result1 = memoizedFn('input')
      const result2 = memoizedFn('input')

      expect(fn).to.be.calledWith('input')
      expect(fn).to.be.calledOnce
      expect(result1).to.equal('output')

      expect(result2).to.equal('output')
    })

    it('accepts a cache instance to use as the second argument', () => {
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
      expect(fn.callCount).to.be.equal(4)
    })
  })
})
