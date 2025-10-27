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
    })

    after(() => {
      process.env['CYPRESS_INTERNAL_ENV'] = env
    })

    context('#existing process.env.CYPRESS_INTERNAL_ENV', () => {
      it('is production', () => {
        process.env['CYPRESS_INTERNAL_ENV'] = 'production'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).to.eq('production')
      })

      it('is development', () => {
        process.env['CYPRESS_INTERNAL_ENV'] = 'development'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).to.eq('development')
      })

      it('is staging', () => {
        process.env['CYPRESS_INTERNAL_ENV'] = 'staging'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).to.eq('staging')
      })
    })

    context('uses package.json env', () => {
      it('is production', () => {
        pkg.env = 'production'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).to.eq('production')
      })

      it('is staging', () => {
        pkg.env = 'staging'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).to.eq('staging')
      })

      it('is test', () => {
        pkg.env = 'test'

        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).to.eq('test')
      })
    })

    context('it uses development by default', () => {
      beforeEach(() => {
        return sinon.stub(fs, 'readJsonSync').returns({})
      })

      it('is development', () => {
        const calculatedEnv = calculateCypressInternalEnv()

        expect(calculatedEnv).to.eq('development')
      })
    })
  })

  describe('configureLongStackTraces', () => {
    beforeEach(() => {
      sinon.stub(Promise, 'config')
    })

    afterEach(() => {
      Promise.config.restore()
    })

    it('configures long stack traces if "development" is passed in as the environment', () => {
      configureLongStackTraces('development')

      expect(Error.stackTraceLimit).to.eq(Infinity)

      expect(Promise.config).to.have.been.calledWith({
        cancellation: true,
        longStackTraces: true,
      })
    })

    it('disables long stack traces in bluebird if value other than "development" is passed in as the environment', () => {
      configureLongStackTraces('production')

      expect(Error.stackTraceLimit).to.eq(Infinity)

      expect(Promise.config).to.have.been.calledWith({
        cancellation: true,
        longStackTraces: false,
      })
    })
  })
})
