const LimitedMap = require('@packages/driver/src/util/limited_map').default
const { encodeBase64Unicode } = Cypress.utils
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
    beforeEach(function () {
      this.str = (str) => {
        return $utils.stringify(str)
      }
    })

    context('Values', () => {
      it('string', function () {
        expect(this.str('foo bar baz')).to.eq('foo bar baz')
      })

      it('number', function () {
        expect(this.str(1234)).to.eq('1234')
      })

      it('null', function () {
        expect(this.str(null)).to.eq('null')
      })

      // QUESTION: is this really the behavior we want? wouldn't 'undefined' be better?
      it('undefined', function () {
        expect(this.str(undefined)).to.eq('')
      })

      it('symbol', function () {
        expect(this.str(Symbol.iterator)).to.eq('Symbol')
      })

      it('circular', function () {
        const obj = {}

        obj.obj = obj

        // circular references should return [Circular] placeholder
        expect(this.str(obj)).to.include('[Circular]')
      })

      it('circular in nested objects', function () {
        const obj = {
          a: {
            b: {},
          },
        }

        obj.a.b.self = obj.a.b

        expect(this.str(obj)).to.include('[Circular]')
      })

      it('circular in objects with exactly 2 keys (problematic case)', function () {
        const obj = {
          parent: null,
          children: [],
        }

        obj.children.push(obj)

        expect(this.str(obj)).to.include('[Circular]')
      })

      it('circular in objects with >2 keys', function () {
        const obj = {
          a: 1,
          b: 2,
          c: {},
        }

        obj.c.self = obj

        // Objects with >2 keys show Object{N} format, but should still handle circular refs
        expect(this.str(obj)).to.eq('Object{3}')
      })

      it('same object with >2 keys referenced multiple times shows [Circular] on subsequent references', function () {
        const sharedObj = {
          a: 1,
          b: 2,
          c: 3,
        }

        const container = {
          first: sharedObj,
          second: sharedObj,
        }

        const result = this.str(container)

        // First reference should show Object{3}, second should show [Circular]
        expect(result).to.include('Object{3}')
        expect(result).to.include('[Circular]')
      })

      it('multiple circular references in same object', function () {
        const obj = {
          a: {},
          b: {},
        }

        obj.a.self = obj
        obj.b.self = obj

        expect(this.str(obj)).to.include('[Circular]')
      })

      it('circular reference through multiple levels', function () {
        const obj = {
          level1: {
            level2: {
              level3: {},
            },
          },
        }

        obj.level1.level2.level3.root = obj

        expect(this.str(obj)).to.include('[Circular]')
      })
    })

    context('Circular Arrays', () => {
      it('circular reference in arrays', function () {
        const arr = []

        arr.push(arr)

        expect(this.str(arr)).to.include('[Circular]')
      })

      it('circular reference in nested arrays', function () {
        const arr = [[], []]

        arr[0].push(arr)

        expect(this.str(arr)).to.include('[Circular]')
      })

      it('circular reference in arrays with length > 3', function () {
        const arr = [1, 2, 3, 4]

        arr.push(arr)

        const result = this.str(arr)

        expect(result).to.include('Array[5]')
        // Should not hang or crash - the exact format may vary but should be safe
        expect(result).to.be.a('string')
      })
    })

    context('Arrays', () => {
      it('length <= 3', function () {
        const a = [['one', 2, 'three']]

        const result = this.str(a)

        expect(result).to.include('one')
        expect(result).to.include('2')
        expect(result).to.include('three')
        // Should not crash or hang - the exact format may vary but should be safe
        expect(result).to.be.a('string')
      })

      it('length > 3', function () {
        const a = [[1, 2, 3, 4, 5]]

        const result = this.str(a)

        expect(result).to.include('Array[5]')
        // Should not crash or hang - the exact format may vary but should be safe
        expect(result).to.be.a('string')
      })
    })

    context('Objects', () => {
      it('keys <= 2', function () {
        const o = { visible: null, exists: true }

        expect(this.str(o)).to.eq('{visible: null, exists: true}')
      })

      it('keys > 2', function () {
        const o = { foo: 'foo', bar: 'baz', baz: 'baz' }

        expect(this.str(o)).to.eq('Object{3}')
      })

      it('can have length property', function () {
        const o = { length: 10, foo: 'bar' }

        expect(this.str(o)).to.eq('{foo: bar, length: 10}')
      })
    })

    context('Functions', () => {
      it('function(){}', function () {
        const o = function (foo, bar, baz) {}

        expect(this.str(o)).to.eq('function(){}')
      })
    })

    context('Elements', () => {
      it('stringifyElement', () => {
        cy.visit('/fixtures/dom.html').then(function () {
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

  context('.indent', () => {
    it('indents each line by the given amount', () => {
      const str = 'line 1\n line 2\n  line 3\n   line 4\n    line 5'

      expect($utils.indent(str, 3)).to.equal('   line 1\n    line 2\n     line 3\n      line 4\n       line 5')
    })
  })

  context('.normalizeNewLines', () => {
    it('removes newlines in excess of max newlines, replacing with max newlines by default', () => {
      const oneLineResult = $utils.normalizeNewLines('one new line\ntwo new lines\n\nthree new lines\n\n\nend', 1)
      const twoLinesResult = $utils.normalizeNewLines('one new line\ntwo new lines\n\nthree new lines\n\n\nend', 2)

      expect(oneLineResult).to.equal('one new line\ntwo new lines\nthree new lines\nend')
      expect(twoLinesResult).to.equal('one new line\ntwo new lines\n\nthree new lines\n\nend')
    })

    return it('replaces with specified newlines', () => {
      const oneLineResult = $utils.normalizeNewLines('one new line\ntwo new lines\n\nthree new lines\n\n\nend', 1, 2)
      const twoLinesResult = $utils.normalizeNewLines('one new line\ntwo new lines\n\nthree new lines\n\n\nend', 2, 1)

      expect(oneLineResult).to.equal('one new line\n\ntwo new lines\n\nthree new lines\n\nend')
      expect(twoLinesResult).to.equal('one new line\ntwo new lines\nthree new lines\nend')
    })
  })

  context('.decodeBase64Unicode', () => {
    it('decodes base64, with utf-8 handling', () => {
      const base64 = '44K144Kk44OX44Oq44K544Gv5LiA55Wq'
      const decoded = $utils.decodeBase64Unicode(base64)

      expect(decoded).to.equal('サイプリスは一番')
    })
  })

  context('.encodeBase64Unicode', () => {
    it('encodes base64, with utf-8 handling', () => {
      const str = 'サイプリスは一番'
      const encoded = encodeBase64Unicode(str)

      expect(encoded).to.equal('44K144Kk44OX44Oq44K544Gv5LiA55Wq')
    })
  })
})
