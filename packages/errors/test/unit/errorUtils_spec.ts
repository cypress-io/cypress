import 'sinon-chai'
import chai, { expect } from 'chai'
import sinon from 'sinon'
import { serializeError, serializeArguments } from '../../src/errorUtils'

chai.use(require('@cypress/sinon-chai'))

describe('errorUtils', () => {
  beforeEach(() => {
    sinon.restore()
  })

  describe('serializeError', () => {
    it('should serialize Error objects to their message', () => {
      const error = new Error('Test error message')
      const result = serializeError(error)

      expect(result).to.equal('Test error message')
    })

    it('should serialize plain objects to JSON string', () => {
      const obj = { key: 'value', nested: { foo: 'bar' } }
      const result = serializeError(obj)

      expect(result).to.equal('{"key":"value","nested":{"foo":"bar"}}')
    })

    it('should serialize arrays to JSON string', () => {
      const arr = [1, 2, { nested: 'value' }]
      const result = serializeError(arr)

      expect(result).to.equal('[1,2,{"nested":"value"}]')
    })

    it('should serialize null to "null"', () => {
      const result = serializeError(null)

      expect(result).to.equal('null')
    })

    it('should serialize undefined to "undefined"', () => {
      const result = serializeError(undefined)

      expect(result).to.equal('undefined')
    })

    it('should serialize strings as-is', () => {
      const result = serializeError('test string')

      expect(result).to.equal('test string')
    })

    it('should serialize numbers as strings', () => {
      const result = serializeError(42)

      expect(result).to.equal('42')
    })

    it('should serialize booleans as strings', () => {
      expect(serializeError(true)).to.equal('true')
      expect(serializeError(false)).to.equal('false')
    })

    it('should serialize functions to their string representation', () => {
      const func = function testFunction () {
        return 'test'
      }
      const result = serializeError(func)

      expect(result).to.include('function testFunction')
    })

    it('should serialize symbols to their string representation', () => {
      const sym = Symbol('test symbol')
      const result = serializeError(sym)

      expect(result).to.equal('Symbol(test symbol)')
    })

    it('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' }

      obj.self = obj // Create circular reference

      const result = serializeError(obj)

      // Should handle circular references gracefully with safe-stringify
      expect(result).to.include('name')
      expect(result).to.include('self')
      expect(result).to.include('[Circular]')
    })

    it('should handle objects with non-serializable properties', () => {
      const obj = {
        normal: 'value',
        func () {},
        symbol: Symbol('test'),
        undefined,
      }

      const result = serializeError(obj)

      // Should handle mixed content gracefully
      expect(result).to.include('normal')
      expect(result).to.include('value')
    })

    it('should handle BigInt gracefully', () => {
      if (typeof BigInt !== 'undefined') {
        const bigInt = BigInt(123)
        const result = serializeError(bigInt)

        // BigInt should be converted to string
        expect(result).to.equal('123')
      }
    })

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00.000Z')
      const result = serializeError(date)

      // Date should be serialized to ISO string
      expect(result).to.include('2023-01-01')
    })

    it('should handle RegExp objects', () => {
      const regex = /test-pattern/gi
      const result = serializeError(regex)

      // RegExp should be serialized to string
      expect(result).to.include('test-pattern')
    })
  })

  describe('serializeArguments', () => {
    it('should return empty array for empty input', () => {
      const result = serializeArguments([])

      expect(result).to.deep.equal([])
    })

    it('should pass through primitive values unchanged', () => {
      const args = ['string', 42, true, null, undefined]
      const result = serializeArguments(args)

      expect(result).to.deep.equal(['string', 42, true, null, undefined])
    })

    it('should deep serialize plain objects', () => {
      const args = [{ key: 'value' }, { nested: { deep: 'value' } }]
      const result = serializeArguments(args)

      // serializeArguments now returns serialized strings for objects
      expect(result[0]).to.equal('{"key":"value"}')
      expect(result[1]).to.equal('{"nested":{"deep":"value"}}')
    })

    it('should deep serialize arrays', () => {
      const args = [[1, 2, 3], ['a', 'b', 'c']]
      const result = serializeArguments(args)

      // serializeArguments now returns serialized strings for arrays
      expect(result[0]).to.equal('[1,2,3]')
      expect(result[1]).to.equal('["a","b","c"]')
    })

    it('should handle mixed content', () => {
      const args = [
        'string',
        42,
        { key: 'value' },
        [1, 2, 3],
        null,
        undefined,
      ]
      const result = serializeArguments(args)

      // serializeArguments now returns serialized strings for objects/arrays
      expect(result[0]).to.equal('string')
      expect(result[1]).to.equal(42)
      expect(result[2]).to.equal('{"key":"value"}')
      expect(result[3]).to.equal('[1,2,3]')
      expect(result[4]).to.equal(null)
      expect(result[5]).to.equal(undefined)
    })

    it('should handle nested objects and arrays', () => {
      const args = [{
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
        metadata: {
          count: 2,
          active: true,
        },
      }]

      const result = serializeArguments(args)

      // serializeArguments now returns serialized strings for complex objects
      expect(result[0]).to.be.a('string')
      expect(result[0]).to.include('John')
      expect(result[0]).to.include('Jane')
      expect(result[0]).to.include('30')
      expect(result[0]).to.include('25')
      expect(result[0]).to.include('count')
      expect(result[0]).to.include('active')
    })

    it('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' }

      obj.self = obj // Create circular reference

      const args = [obj, 'normal string']
      const result = serializeArguments(args)

      // First argument should handle circular references gracefully with serialize-error fallback
      expect(result[0]).to.be.an('object')
      expect(result[0]).to.have.property('name', 'test')
      expect(result[0]).to.have.property('self', '[Circular]')
      expect(result[1]).to.equal('normal string')
    })

    it('should handle objects that actually fail serialization', () => {
      // Create an object that will actually fail JSON.stringify
      const circularObj: any = { name: 'test' }

      circularObj.self = circularObj

      const args = [
        { normal: 'value' },
        circularObj,
      ]

      const result = serializeArguments(args)

      // First object should serialize normally
      expect(result[0]).to.equal('{"normal":"value"}')

      // Second object should handle circular references gracefully with serialize-error fallback
      expect(result[1]).to.be.an('object')
      expect(result[1]).to.have.property('name', 'test')
      expect(result[1]).to.have.property('self', '[Circular]')
    })

    it('should handle Error objects', () => {
      const error = new Error('Test error')
      const args = [error, 'string arg']

      const result = serializeArguments(args)

      // Error should be serialized to plain object
      expect(result[0]).to.have.property('message', 'Test error')
      expect(result[0]).to.have.property('stack')
      expect(result[1]).to.equal('string arg')
    })

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00.000Z')
      const args = [date, 'string arg']

      const result = serializeArguments(args)

      // Date should be serialized to string by serialize-javascript
      expect(result[0]).to.be.a('string')
      expect(result[0]).to.include('2023-01-01')
      expect(result[1]).to.equal('string arg')
    })

    it('should handle RegExp objects', () => {
      const regex = /test-pattern/gi
      const args = [regex, 'string arg']

      const result = serializeArguments(args)

      // RegExp should be serialized to string by serialize-javascript
      expect(result[0]).to.be.a('string')
      expect(result[0]).to.include('test-pattern')
      expect(result[1]).to.equal('string arg')
    })

    it('should handle functions gracefully', () => {
      const func = function testFunction () {
        return 'test'
      }
      const args = [func, 'string arg']

      const result = serializeArguments(args)

      // Function should fall back to string conversion
      expect(result[0]).to.be.a('string')
      expect(result[0]).to.include('testFunction')
      expect(result[1]).to.equal('string arg')
    })

    it('should handle symbols gracefully', () => {
      const sym = Symbol('test symbol')
      const args = [sym, 'string arg']

      const result = serializeArguments(args)

      // Symbol should fall back to string conversion
      expect(result[0]).to.be.a('string')
      expect(result[0]).to.include('test symbol')
      expect(result[1]).to.equal('string arg')
    })
  })

  describe('integration scenarios', () => {
    it('should handle complex nested structures with mixed types', () => {
      const complexObj = {
        string: 'value',
        number: 42,
        boolean: true,
        null: null,
        undefined,
        array: [1, 'two', { nested: 'value' }],
        object: {
          deep: {
            deeper: {
              deepest: 'value',
            },
          },
        },
        error: new Error('Nested error'),
        date: new Date('2023-01-01T00:00:00.000Z'),
      }

      const args = [complexObj, 'simple string', 123]
      const result = serializeArguments(args)

      // Should handle complex nested structure as serialized string
      expect(result[0]).to.be.a('string')
      expect(result[0]).to.include('value')
      expect(result[0]).to.include('42')
      expect(result[0]).to.include('nested')
      expect(result[1]).to.equal('simple string')
      expect(result[2]).to.equal(123)
    })

    it('should handle the specific [object Object] scenario we were solving', () => {
      // This is the exact scenario we were trying to prevent
      const errorObj = {
        message: 'Something went wrong',
        details: {
          userId: 123,
          action: 'update',
          timestamp: new Date(),
        },
      }

      // Without proper serialization, this would show as [object Object]
      const serialized = serializeError(errorObj)

      expect(serialized).to.include('Something went wrong')
      expect(serialized).to.include('userId')
      expect(serialized).to.include('123')
      expect(serialized).to.include('action')
      expect(serialized).to.include('update')
      expect(serialized).to.not.equal('[object Object]')
    })
  })
})
