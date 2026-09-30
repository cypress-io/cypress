import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import Promise from 'bluebird'
import pkg from '@packages/root'
import { fs } from '../../lib/util/fs'
import { calculateCypressInternalEnv, configureLongStackTraces } from '../../lib/environment'

const env = process.env['CYPRESS_INTERNAL_ENV']

describe('lib/environment', () => {
  describe('calculateCypressInternalEnv', () => {
    beforeEach(() => {
      delete process.env['CYPRESS_INTERNAL_ENV']
    })

    afterEach(() => {
      delete pkg.env
      delete process.env['CYPRESS_INTERNAL_ENV']
      vi.restoreAllMocks()
    })

    afterAll(() => {
      process.env['CYPRESS_INTERNAL_ENV'] = env
    })

    describe('#existing process.env.CYPRESS_INTERNAL_ENV', () => {
      it('is production', () => {
        process.env['CYPRESS_INTERNAL_ENV'] = 'production'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).toBe('production')
      })

      it('is development', () => {
        process.env['CYPRESS_INTERNAL_ENV'] = 'development'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).toBe('development')
      })

      it('is staging', () => {
        process.env['CYPRESS_INTERNAL_ENV'] = 'staging'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).toBe('staging')
      })
    })

    describe('uses package.json env', () => {
      it('is production', () => {
        pkg.env = 'production'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).toBe('production')
      })

      it('is staging', () => {
        pkg.env = 'staging'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).toBe('staging')
      })

      it('is test', () => {
        pkg.env = 'test'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).toBe('test')
      })
    })

    describe('it uses development by default', () => {
      beforeEach(() => {
        vi.spyOn(fs, 'readJsonSync').mockReturnValue({})
      })

      it('is development', () => {
        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).toBe('development')
      })
    })
  })

  describe('configureLongStackTraces', () => {
    beforeEach(() => {
      vi.spyOn(Promise, 'config')
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('configures long stack traces if "development" is passed in as the environment', () => {
      configureLongStackTraces('development')

      expect(Error.stackTraceLimit).toBe(Infinity)

      expect(Promise.config).toHaveBeenCalledWith({
        cancellation: true,
        longStackTraces: true,
      })
    })

    it('disables long stack traces in bluebird if value other than "development" is passed in as the environment', () => {
      configureLongStackTraces('production')

      expect(Error.stackTraceLimit).toBe(Infinity)

      expect(Promise.config).toHaveBeenCalledWith({
        cancellation: true,
        longStackTraces: false,
      })
    })
  })
})
