import $SetterGetter from '../../../src/cypress/setter_getter'
import { getMochaOverrideLevel, validateConfig } from '../../../src/util/config'
import type { StateFunc } from '../../../src/cypress/state'

// `$SetterGetter.create` is untyped, so its setter/getter does not structurally satisfy
// the overloads `validateConfig` expects. Assert it once here rather than at every call.
const createState = (state: Record<string, any>) => $SetterGetter.create(state) as unknown as StateFunc

describe('driver/src/cypress/validate_config', () => {
  describe('getMochaOverrideLevel', () => {
    it('returns override level of undefined', () => {
      const state = createState({
        duringUserTestExecution: true,
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.be.undefined
    })

    it('returns override level of test:before:run:async', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: {
          _fired: { 'runner:test:before:run': true, 'runner:test:before:run:async': true },
        },
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.be.undefined
    })

    it('returns override level of restoring', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: {
          _testConfig: { applied: 'restoring' },
        },
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.eq('restoring')
    })

    it('returns override level of suite', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: {
          _testConfig: { applied: 'suite' },
        },
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.eq('suite')
    })

    it('returns override level of test', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: {
          _testConfig: { applied: 'test' },
        },
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.eq('test')
    })

    it('returns override level of fileLoad', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: undefined,
      })
      const overrideLevel = getMochaOverrideLevel(state)

      expect(overrideLevel).to.be.undefined
    })
  })

  describe('validate config', () => {
    it('does not throw for non-cypress configuration options', () => {
      const state = createState({
        duringUserTestExecution: false,
      })

      expect(() => validateConfig(state, { hello: 'world' })).not.to.throw()
    })

    describe('ensures override level', () => {
      it('throws when config override level is never', () => {
        const state = createState({
          duringUserTestExecution: true,
          specWindow: { Error },
          runnable: { type: 'suite' },
        })
        const overrideLevel = getMochaOverrideLevel(state)

        expect(overrideLevel).to.be.undefined

        expect(() => {
          validateConfig(state, { chromeWebSecurity: true })
        }).to.throw(`\`Cypress.config()\` can never override \`chromeWebSecurity\` because it is a read-only configuration option.`)
      })

      describe('when config override level is suite', () => {
        it('does not throw when runtime level is suite', () => {
          const state = createState({
            duringUserTestExecution: false,
            test: {
              _testConfig: { applied: 'suite' },
            },
            specWindow: { Error },
          })
          const overrideLevel = getMochaOverrideLevel(state)

          expect(overrideLevel).to.eq('suite')

          expect(() => {
            validateConfig(state, { testIsolation: true })
          }).not.to.throw()
        })

        it('throws when runtime level is not suite', () => {
          const state = createState({
            duringUserTestExecution: false,
            test: {
              _testConfig: { applied: 'test' },
            },
            specWindow: { Error },
          })
          const overrideLevel = getMochaOverrideLevel(state)

          expect(overrideLevel).to.eq('test')

          expect(() => {
            validateConfig(state, { testIsolation: true })
          }).to.throw(`The \`testIsolation\` configuration can only be overridden from a suite-level override.`)
        })
      })

      describe('when config override level is suiteOrTest', () => {
        ['test', 'suite'].forEach((mocha_runnable) => {
          it(`does not throw when runtime level is ${mocha_runnable}`, () => {
            const state = createState({
              duringUserTestExecution: false,
              test: {
                _testConfig: { applied: mocha_runnable },
              },
              specWindow: { Error },
            })
            const overrideLevel = getMochaOverrideLevel(state)

            expect(overrideLevel).to.eq(mocha_runnable)

            expect(() => {
              validateConfig(state, { viewportWidth: 200, viewportHeight: 100, blockHosts: 'example.com' })
            }).not.to.throw()
          })
        })

        it('throws when mutated at run-time with Cypress.config()', () => {
          const state = createState({
            duringUserTestExecution: true,
            specWindow: { Error },
            runnable: { type: 'test' },
          })
          const overrideLevel = getMochaOverrideLevel(state)

          expect(overrideLevel).to.be.undefined

          expect(() => {
            validateConfig(state, { viewportWidth: 200 })
          }).to.throw(`\`Cypress.config()\` cannot override \`viewportWidth\` during test execution`)

          expect(() => {
            validateConfig(state, { blockHosts: 'example.com' })
          }).to.throw(`\`Cypress.config()\` cannot override \`blockHosts\` during test execution`)
        })

        it('does not throw when set outside test execution (e.g. support/spec file load)', () => {
          const state = createState({
            duringUserTestExecution: false,
            test: undefined,
            specWindow: { Error },
          })
          const overrideLevel = getMochaOverrideLevel(state)

          expect(overrideLevel).to.be.undefined

          expect(() => {
            validateConfig(state, { viewportWidth: 200, viewportHeight: 100, blockHosts: 'example.com' })
          }).not.to.throw()
        })
      })

      describe('when the config option is env', () => {
        it('throws when mutated at run-time with Cypress.config()', () => {
          const state = createState({
            duringUserTestExecution: true,
            specWindow: { Error },
            runnable: { type: 'test' },
          })

          expect(() => {
            validateConfig(state, { env: { FOO: 'bar' } })
          }).to.throw('Overriding the `env` configuration was removed in Cypress version 16.0.0.')
        })

        ;['test', 'suite'].forEach((mocha_runnable) => {
          it(`throws when config override level is ${mocha_runnable}`, () => {
            const state = createState({
              duringUserTestExecution: false,
              test: {
                _testConfig: { applied: mocha_runnable },
              },
              specWindow: { Error },
            })

            expect(() => {
              validateConfig(state, { env: { FOO: 'bar' } })
            }).to.throw('Please update to use `expose: { KEY: value }` to make a value readable in the browser for a suite or test.')
          })
        })
      })

      describe('when config override level is suite', () => {
        it('and config override is read-only', () => {
          const state = createState({
            duringUserTestExecution: false,
            specWindow: { Error },
          })
          const overrideLevel = getMochaOverrideLevel(state)

          expect(overrideLevel).to.be.undefined

          expect(() => {
            validateConfig(state, { chromeWebSecurity: true })
          }).to.throw(`\`Cypress.config()\` can never override \`chromeWebSecurity\` because it is a read-only configuration option.`)
        })

        ;['test', 'suite'].forEach((mocha_runnable) => {
          it(`and config override level is ${mocha_runnable}`, () => {
            const state = createState({
              duringUserTestExecution: false,
              test: {
                _testConfig: { applied: mocha_runnable },
              },
              specWindow: { Error },
            })
            const overrideLevel = getMochaOverrideLevel(state)

            expect(overrideLevel).to.eq(mocha_runnable)

            expect(() => {
              validateConfig(state, { chromeWebSecurity: false })
            }).to.throw(`The \`chromeWebSecurity\` configuration can never be overridden because it is a read-only configuration option.`)
          })
        })
      })
    })

    it('skips checking override level when opted-out', () => {
      const state = createState({
        duringUserTestExecution: true,
        specWindow: { Error },
        runnable: { type: 'test' },
      })

      const skipOverrideCHeck = true

      expect(() => {
        validateConfig(state, { chromeWebSecurity: true }, skipOverrideCHeck)
      }).not.to.throw()
    })

    it('skips checking override level when restoring global configuration before next test', () => {
      const state = createState({
        duringUserTestExecution: false,
        test: {
          _testConfig: { applied: 'restoring' },
        },
        specWindow: { Error },
      })

      expect(() => {
        validateConfig(state, { testIsolation: true })
      }).not.to.throw()
    })

    it('throws when invalid configuration value', () => {
      const state = createState({
        duringUserTestExecution: true,
        specWindow: { Error },
        runnable: { type: 'test' },
      })

      expect(() => {
        validateConfig(state, { defaultCommandTimeout: '300' })
      }).to.throw(`Expected \`defaultCommandTimeout\` to be a number.\n\nInstead the value was: \`"300"\``)
    })
  })
})
