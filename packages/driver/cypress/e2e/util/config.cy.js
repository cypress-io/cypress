import $SetterGetter from '@packages/driver/src/cypress/setter_getter'
import { getOverrideLevel, validateConfig } from '../../../src/util/config'

describe('driver/src/cypress/validate_config', () => {
  describe('getOverrideLevel', () => {
    it('returns override level of runtime', () => {
      const state = $SetterGetter.create({
        duringUserTestExecution: true,
      })
      const overrideLevel = getOverrideLevel(state)

      expect(overrideLevel).to.eq('runtime')
    })

    it('returns override level of test:before:run:async', () => {
      const state = $SetterGetter.create({
        duringUserTestExecution: false,
        test: {
          _fired: { 'runner:test:before:run': true, 'runner:test:before:run:async': true },
        },
      })
      const overrideLevel = getOverrideLevel(state)

      expect(overrideLevel).to.eq('event')
    })

    it('returns override level of test:before:run', () => {
      const state = $SetterGetter.create({
        duringUserTestExecution: false,
        test: {
          _fired: { 'runner:test:before:run': true },
        },
      })
      const overrideLevel = getOverrideLevel(state)

      expect(overrideLevel).to.eq('event')
    })

    it('returns override level of suite', () => {
      const state = $SetterGetter.create({
        duringUserTestExecution: false,
        test: {
          _testConfig: { applied: 'suite' },
        },
      })
      const overrideLevel = getOverrideLevel(state)

      expect(overrideLevel).to.eq('suite')
    })

    it('returns override level of test', () => {
      const state = $SetterGetter.create({
        duringUserTestExecution: false,
        test: {
          _testConfig: { applied: 'test' },
        },
      })
      const overrideLevel = getOverrideLevel(state)

      expect(overrideLevel).to.eq('test')
    })

    it('returns override level of code', () => {
      const state = $SetterGetter.create({
        duringUserTestExecution: false,
        test: undefined,
      })
      const overrideLevel = getOverrideLevel(state)

      expect(overrideLevel).to.eq('code')
    })
  })

  describe('validate config', () => {
    it('does not throw for non-cypress configuration options', () => {
      const state = $SetterGetter.create({
        duringUserTestExecution: false,
      })
      const isRunMode = true
      const shouldSet = validateConfig(state, { hello: 'world' }, isRunMode)

      expect(shouldSet).to.be.true
    })

    it('skips validation in run mode when override level is test:before:run', () => {
      const state = $SetterGetter.create({
        duringUserTestExecution: false,
        test: {
          _fired: { 'runner:test:before:run': true },
        },
      })
      const isRunMode = true
      const shouldSet = validateConfig(state, {}, isRunMode)

      expect(shouldSet).to.be.false
    })

    it('run validation in open mode when override level is test:before:run', () => {
      const state = $SetterGetter.create({
        duringUserTestExecution: false,
        test: {
          _fired: { 'runner:test:before:run': true },
        },
      })
      const isRunMode = false
      const shouldSet = validateConfig(state, {}, isRunMode)

      expect(shouldSet).to.be.true
    })

    describe('ensures override level', () => {
      describe('throws when override level is runtime', () => {
        it('and config override is read-only', () => {
          const state = $SetterGetter.create({
            duringUserTestExecution: true,
            specWindow: { Error },
            runnable: { type: 'suite' },
          })
          const overrideLevel = getOverrideLevel(state)

          expect(overrideLevel).to.eq('runtime')
          const isRunMode = true

          expect(() => {
            validateConfig(state, { chromeWebSecurity: true }, isRunMode)
          }).to.throw(`\`Cypress.config()\` cannot override \`chromeWebSecurity\` in a suite at runtime because it is a read-only configuration option.`)
        })

        it('and config override invalid at runtime', () => {
          const state = $SetterGetter.create({
            duringUserTestExecution: true,
            specWindow: { Error },
            runnable: { type: 'test' },
          })
          const overrideLevel = getOverrideLevel(state)

          expect(overrideLevel).to.eq('runtime')
          const isRunMode = true

          expect(() => {
            validateConfig(state, { testIsolation: 'strict' }, isRunMode)
          }).to.throw(`\`Cypress.config()\` cannot override \`testIsolation\` in a test at runtime. The \`testIsolation\` option can only be overridden from suite-level overrides.`)
        })
      })

      describe('throws when override level is associated to an event config override', () => {
        it('and config override is read-only', () => {
          const state = $SetterGetter.create({
            duringUserTestExecution: false,
            test: {
              _fired: { 'runner:test:before:run': true },
            },
            specWindow: { Error },
          })
          const overrideLevel = getOverrideLevel(state)

          expect(overrideLevel).to.eq('event')
          const isRunMode = false

          expect(() => {
            validateConfig(state, { chromeWebSecurity: true }, isRunMode)
          }).to.throw(`\`Cypress.config()\` can never override \`chromeWebSecurity\` in a test:before:run event handler because it is a read-only configuration option.`)
        })

        it('and config override invalid for override level', () => {
          const state = $SetterGetter.create({
            duringUserTestExecution: false,
            test: {
              _fired: { 'runner:test:before:run': true, 'runner:test:before:run:async': true },
            },
            specWindow: { Error },
          })
          const overrideLevel = getOverrideLevel(state)

          expect(overrideLevel).to.eq('event')
          const isRunMode = true

          expect(() => {
            validateConfig(state, { testIsolation: 'strict' }, isRunMode)
          }).to.throw(`\`Cypress.config()\` cannot override \`testIsolation\` in a test:before:run:async event handler. The \`testIsolation\` option can only be overridden from suite-level overrides.`)
        })
      })

      describe('throws when override level is associated to a mocha config override', () => {
        it('and config override is read-only', () => {
          const state = $SetterGetter.create({
            duringUserTestExecution: false,
            test: {
              _testConfig: { applied: 'suite' },
            },
            specWindow: { Error },
          })
          const overrideLevel = getOverrideLevel(state)

          expect(overrideLevel).to.eq('suite')
          const isRunMode = true

          expect(() => {
            validateConfig(state, { chromeWebSecurity: true }, isRunMode)
          }).to.throw(`The \`chromeWebSecurity\` configuration cannot been overridden from a suite-level override because it is a read-only configuration option.`)
        })

        it('and config override invalid for override level', () => {
          const state = $SetterGetter.create({
            duringUserTestExecution: false,
            test: {
              _testConfig: { applied: 'test' },
            },
            specWindow: { Error },
          })
          const overrideLevel = getOverrideLevel(state)

          expect(overrideLevel).to.eq('test')
          const isRunMode = true

          expect(() => {
            validateConfig(state, { testIsolation: 'strict' }, isRunMode)
          }).to.throw(`The \`testIsolation\` configuration cannot been overridden from a test-level override. The \`testIsolation\` option can only be overridden from suite-level overrides.`)
        })
      })

      describe('throws when override level is code', () => {
        it('and config override is read-only', () => {
          const state = $SetterGetter.create({
            duringUserTestExecution: false,
            specWindow: { Error },
          })
          const overrideLevel = getOverrideLevel(state)

          expect(overrideLevel).to.eq('code')
          const isRunMode = true

          expect(() => {
            validateConfig(state, { chromeWebSecurity: true }, isRunMode)
          }).to.throw(`\`Cypress.config()\` cannot override \`chromeWebSecurity\` because it is a read-only configuration option.`)
        })

        it('and config override invalid at runtime', () => {
          const state = $SetterGetter.create({
            duringUserTestExecution: false,
            specWindow: { Error },
          })
          const overrideLevel = getOverrideLevel(state)

          expect(overrideLevel).to.eq('code')
          const isRunMode = true

          expect(() => {
            validateConfig(state, { testIsolation: 'strict' }, isRunMode)
          }).to.throw(`\`Cypress.config()\` cannot override \`testIsolation\`. The \`testIsolation\` option can only be overridden from suite-level overrides.`)
        })
      })
    })

    it('throws when invalid configuration value', () => {
      const state = $SetterGetter.create({
        duringUserTestExecution: true,
        specWindow: { Error },
        runnable: { type: 'test' },
      })
      const isRunMode = true

      expect(() => {
        validateConfig(state, { viewportHeight: '300' }, isRunMode)
      }).to.throw(`Expected \`viewportHeight\` to be a number.\n\nInstead the value was: \`"300"\``)
    })
  })
})
