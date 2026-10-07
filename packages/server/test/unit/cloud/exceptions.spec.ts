import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import api from '../../../lib/cloud/api'
import user from '../../../lib/cloud/user'
import exception from '../../../lib/cloud/exception'
import * as system from '../../../lib/util/system'
import pkg from '@packages/root'

describe('lib/cloud/exceptions', () => {
  const originalVersion = pkg.version

  afterEach(() => {
    pkg.version = originalVersion
    vi.restoreAllMocks()
  })

  describe('.getAuthToken', () => {
    it('returns authToken from cache', () => {
      vi.spyOn(user, 'get').mockResolvedValue({ authToken: 'auth-token-123' })

      return exception.getAuthToken().then((authToken) => {
        expect(authToken).toBe('auth-token-123')
      })
    })

    it('returns undefined if no authToken', () => {
      vi.spyOn(user, 'get').mockResolvedValue({})

      return exception.getAuthToken().then((authToken) => {
        expect(authToken).toBeUndefined()
      })
    })
  })

  describe('.getErr', () => {
    it('returns an object literal', () => {
      const err = new Error()

      expect(Object.keys(exception.getErr(err)).sort()).toEqual(['message', 'name', 'stack'])
    })

    describe('fields', () => {
      let err

      beforeEach(() => {
        try {
          // @ts-expect-error
          return foo.bar()
        } catch (e) {
          err = e
        }
      })

      it('has name', () => {
        const obj = exception.getErr(err)

        expect(obj.name).toBe(err.name)
      })

      it('has message', () => {
        const obj = exception.getErr(err)

        expect(obj.message).toBe(err.message)
      })

      it('has stack', () => {
        const obj = exception.getErr(err)

        expect(obj.stack).toBeTypeOf('string')

        expect(obj.stack).toContain('foo is not defined')
      })
    })

    describe('path stripping', () => {
      let err
      let windowsError

      beforeEach(() => {
        err = {
          name: 'Path not found: /Users/ruby/dev/',
          message: 'Could not find /Users/ruby/dev/foo.js',
          stack: `\
Error at /Users/ruby/dev/index.js:102
at foo /Users/ruby/dev/foo.js:4
at bar /Users/ruby/dev/bar.js:92\
`,
        }

        windowsError = {
          name: 'Path not found: \\Users\\ruby\\dev\\',
          message: 'Could not find \\Users\\ruby\\dev\\foo.js',
          stack: `\
Error at \\Users\\ruby\\dev\\index.js:102
at foo \\Users\\ruby\\dev\\foo.js:4
at bar \\Users\\ruby\\dev\\bar.js:92\
`,
        }
      })

      it('strips paths from name, leaving file name and line number', () => {
        expect(exception.getErr(err).name).toBe('Path not found: <stripped-path>')

        expect(exception.getErr(windowsError).name).toBe('Path not found: <stripped-path>')
      })

      it('strips paths from message, leaving file name and line number', () => {
        expect(exception.getErr(err).message).toBe('Could not find <stripped-path>foo.js')

        expect(exception.getErr(windowsError).message).toBe('Could not find <stripped-path>foo.js')
      })

      it('strips paths from stack, leaving file name and line number', () => {
        expect(exception.getErr(err).stack).toBe(`\
Error at <stripped-path>index.js:102
at foo <stripped-path>foo.js:4
at bar <stripped-path>bar.js:92\
`)

        expect(exception.getErr(windowsError).stack).toBe(`\
Error at <stripped-path>index.js:102
at foo <stripped-path>foo.js:4
at bar <stripped-path>bar.js:92\
`)
      })

      it('handles strippable properties being undefined gracefully', () => {
        expect(() => {
          return exception.getErr({})
        }).not.toThrow()
      })
    })
  })

  describe('.getVersion', () => {
    it('returns version from package.json', () => {
      pkg.version = '0.1.2'

      expect(exception.getVersion()).toBe('0.1.2')
    })
  })

  describe('.getBody', () => {
    let err

    beforeEach(() => {
      err = new Error()
      pkg.version = '0.1.2'

      vi.spyOn(system, 'info').mockResolvedValue({
        system: 'info',
      })
    })

    it('sets err', () => {
      return exception.getBody(err).then((body) => {
        expect(body.err).toBeTypeOf('object')
      })
    })

    it('sets version', () => {
      return exception.getBody(err).then((body) => {
        expect(body.version).toBe('0.1.2')
      })
    })

    it('sets system info', () => {
      return exception.getBody(err).then((body) => {
        expect(body.system).toBe('info')
      })
    })
  })

  describe('.create', () => {
    let env

    beforeEach(() => {
      env = process.env['CYPRESS_INTERNAL_ENV']

      vi.spyOn(api, 'createCrashReport').mockImplementation(() => undefined)
    })

    afterEach(() => {
      process.env['CYPRESS_INTERNAL_ENV'] = env
    })

    describe('with CYPRESS_CRASH_REPORTS=0', () => {
      beforeEach(() => {
        return process.env['CYPRESS_CRASH_REPORTS'] = '0'
      })

      afterEach(() => {
        return delete process.env['CYPRESS_CRASH_REPORTS']
      })

      it('immediately resolves', () => {
        return exception.create()
        .then(() => {
          expect(api.createCrashReport).not.toHaveBeenCalled()
        })
      })
    })

    // Reported as production, so the opt-out is what stops the report rather than
    // the environment check ahead of it.
    describe('with CYPRESS_DISABLE_GUEST_TELEMETRY set', () => {
      beforeEach(() => {
        process.env['CYPRESS_INTERNAL_ENV'] = 'production'

        return process.env['CYPRESS_DISABLE_GUEST_TELEMETRY'] = '1'
      })

      afterEach(() => {
        return delete process.env['CYPRESS_DISABLE_GUEST_TELEMETRY']
      })

      it('immediately resolves', () => {
        return exception.create()
        .then(() => {
          expect(api.createCrashReport).not.toHaveBeenCalled()
        })
      })
    })

    describe('development', () => {
      beforeEach(() => {
        return process.env['CYPRESS_INTERNAL_ENV'] = 'development'
      })

      it('immediately resolves', () => {
        return exception.create()
        .then(() => {
          expect(api.createCrashReport).not.toHaveBeenCalled()
        })
      })
    })

    describe('production', () => {
      let err

      beforeEach(() => {
        process.env['CYPRESS_INTERNAL_ENV'] = 'production'

        err = { name: 'ReferenceError', message: 'undefined is not a function', stack: 'asfd' }

        vi.spyOn(exception, 'getBody').mockResolvedValue({
          err,
          version: '0.1.2',
        })

        vi.spyOn(exception, 'getAuthToken').mockResolvedValue('auth-token-123')
      })

      it('sends body + authToken to api.createCrashReport', () => {
        vi.mocked(api.createCrashReport).mockResolvedValue(undefined)

        return exception.create().then(() => {
          const body = {
            err,
            version: '0.1.2',
          }

          expect(api.createCrashReport).toHaveBeenCalledWith(body, 'auth-token-123')
        })
      })
    })
  })

  describe('.safeErrorSerialize', () => {
    it('returns string as-is when error is already a string', () => {
      const stringError = 'Simple string error'

      expect(exception.safeErrorSerialize(stringError)).toBe('Simple string error')
    })

    it('serializes plain objects properly', () => {
      const objectError = {
        additionalData: { type: 'studio:panel:opened' },
        message: 'Something went wrong',
        code: 'TELEMETRY_ERROR',
      }

      const result = exception.safeErrorSerialize(objectError)

      expect(result).toBe(JSON.stringify(objectError))
    })

    it('handles circular reference objects safely without throwing', () => {
      // Create an object with circular reference
      const circularError = {
        message: 'Circular reference error',
        code: 'CIRCULAR_ERROR',
      }

      circularError.self = circularError // Create circular reference

      const result = exception.safeErrorSerialize(circularError)

      expect(result).toBe(JSON.stringify({
        message: 'Circular reference error',
        code: 'CIRCULAR_ERROR',
        self: '[Circular]',
      }))
    })

    it('handles Error objects correctly', () => {
      const error = new Error('test error')

      error.code = 'TEST_CODE'
      error.errno = 123

      const result = exception.safeErrorSerialize(error)

      // serializeError should preserve Error properties
      const parsed = JSON.parse(result)

      expect(parsed.message).toBe('test error')
      expect(parsed.name).toBe('Error')
      expect(parsed.code).toBe('TEST_CODE')
      expect(parsed.errno).toBe(123)
    })

    it('handles null and undefined gracefully', () => {
      expect(exception.safeErrorSerialize(null)).toBe('null')
      expect(exception.safeErrorSerialize(undefined)).toBe('undefined')
    })

    it('handles primitive types', () => {
      expect(exception.safeErrorSerialize(42)).toBe('42')
      expect(exception.safeErrorSerialize(true)).toBe('true')
      expect(exception.safeErrorSerialize(false)).toBe('false')
    })

    it('provides fallback for non-serializable objects', () => {
      // Create an object that might cause issues
      const problematicObject = {
        get value () {
          throw new Error('Cannot access value')
        },
      }

      const result = exception.safeErrorSerialize(problematicObject)

      expect(result).toMatch(/^\[Non-serializable object:/)
    })

    it('handles deeply nested objects', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                message: 'Deep error',
                data: [1, 2, 3, { nested: true }],
              },
            },
          },
        },
      }

      const result = exception.safeErrorSerialize(deepObject)

      expect(result).toBe(JSON.stringify(deepObject))
    })

    it('handles arrays with mixed content', () => {
      const arrayError = [
        'string',
        42,
        { message: 'object in array' },
        null,
        undefined,
      ]

      const result = exception.safeErrorSerialize(arrayError)

      expect(result).toBe(JSON.stringify(arrayError))
    })
  })
})
