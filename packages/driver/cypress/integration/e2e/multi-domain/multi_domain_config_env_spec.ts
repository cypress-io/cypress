// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain - Cypress.config()/Cypress.env()', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  afterEach(() => {
    // @ts-ignore
    window.top.__cySkipValidateConfig = true
  })

  context('Cypress.config()', () => {
    it('throws if mutating read-only config with Cypress.config()', (done) => {
      // @ts-ignore
      window.top.__cySkipValidateConfig = false
      cy.on('fail', (err) => {
        expect(err.message).to.include('`Cypress.config()` cannot mutate option `chromeWebSecurity` because it is a read-only property.')
        done()
      })

      cy.switchToDomain('foobar.com', () => {
        // @ts-ignore
        Cypress.config('chromeWebSecurity', false)
      })
    })

    context('serializable', () => {
      it('syncs initial config from the primary domain to the secondary (synchronously)', () => {
        // @ts-ignore
        Cypress.config('foo', 'bar')
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const isBar = Cypress.config('foo')

          expect(isBar).to.equal('bar')
        })
      })

      it('syncs serializable values in the config again to the secondary even after spec bridge is created', () => {
        // @ts-ignore
        Cypress.config('foo', 'baz')
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const baz = Cypress.config('foo')

          expect(baz).to.equal('baz')
        })
      })

      it('syncs serializable config values outwards from secondary (synchronously)', () => {
        // @ts-ignore
        const isUndefined = Cypress.config('bar')

        expect(isUndefined).to.be.undefined
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          Cypress.config('bar', 'baz')
        })

        // @ts-ignore
        Cypress.config('bar', 'foo')

        cy.wrap({}).then(() => {
          // @ts-ignore
          const baz = Cypress.config('bar')

          expect(baz).to.equal('baz')
        })
      })

      // FIXME: unskip this test once tail-end waiting is implemented
      it.skip('syncs serializable config values outwards from secondary (commands/async)', () => {
        cy.switchToDomain('foobar.com', () => {
          cy.wrap({}).then(() => {
            // @ts-ignore
            Cypress.config('bar', 'quux')
          })
        })

        cy.wrap({}).then(() => {
          // @ts-ignore
          const quux = Cypress.config('bar')

          expect(quux).to.equal('quux')
        })
      })

      it('persists configuration changes made in the secondary, assuming primary has not overwritten with a serializable value', () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const baz = Cypress.config('bar')

          expect(baz).to.equal('baz')
        })
      })

      it('does NOT sync config changes made in the secondary after the command queue is finished and the callback window is closed', {
        // @ts-ignore
        baz: undefined,
      }, (done) => {
        cy.switchToDomain('foobar.com', () => {
          setTimeout(() => {
            // this value STILL gets set, but will be blown away on the next switchToDomain with whatever exists in the primary
            // @ts-ignore
            Cypress.config('baz', 'qux')
          }, 100)

          // @ts-ignore
          Cypress.config('baz', 'quux')
        })

        // @ts-ignore
        const isUndefined = Cypress.config('baz')

        expect(isUndefined).to.be.undefined

        cy.wrap({}).then(() => {
          // @ts-ignore
          const isQuux = Cypress.config('baz')

          expect(isQuux).to.equal('quux')
          done()
        })
      })

      it('overwrites different values in secondary if one exists in the primary', {
        // @ts-ignore
        baz: 'quux',
      }, () => {
        cy.switchToDomain('foobar.com', () => {
          // in previous test, 'baz' was set to 'qux' after the callback window was closed.
          // this should be overwritten by 'quux' that exists in the primary
          // @ts-ignore
          const isNowQuux = Cypress.config('baz')

          expect(isNowQuux).to.equal('quux')
        })
      })

      it('overwrites different values in secondary, even if the config value does not exist in the primary', {
        // @ts-ignore
        baz: undefined,
      }, () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const isNowUndefined = Cypress.config('baz')

          expect(isNowUndefined).to.be.undefined
        })
      })
    })

    context('unserializable', () => {
      const unserializableFunc = () => undefined

      it('does not sync unserializable values from the primary to the secondary', () => {
        // @ts-ignore
        Cypress.config('unserializable', unserializableFunc)
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const isUndefined = Cypress.config('unserializable')

          expect(isUndefined).to.be.undefined
        })
      })

      it('does not overwrite unserializable values in the primary when none exist in the secondary', () => {
        // @ts-ignore
        Cypress.config('unserializable', unserializableFunc)
        cy.switchToDomain('foobar.com', () => undefined)

        // @ts-ignore
        const isFunc = Cypress.config('unserializable')

        expect(isFunc).to.equal(unserializableFunc)
      })

      it('overwrites unserializable values in the primary when serializable values of same key exist in secondary', () => {
        // @ts-ignore
        Cypress.config('unserializable', unserializableFunc)
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          Cypress.config('unserializable', undefined)
        })

        cy.wrap({}).then(() => {
          // @ts-ignore
          const isNowUndefined = Cypress.config('undefined')

          expect(isNowUndefined).to.be.undefined
        })
      })

      it('overwrites unserializable values in the secondary when serializable values of same key exist in primary', () => {
        cy.switchToDomain('foobar.com', () => {
          const unserializableFuncSecondary = () => undefined

          // @ts-ignore
          Cypress.config('unserializable', unserializableFuncSecondary)
        })

        cy.wrap({}).then(() => {
          // @ts-ignore
          Cypress.config('unserializable', undefined)
        })

        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const isUndefined = Cypress.config('unserializable')

          expect(isUndefined).to.be.undefined
        })

        cy.wrap({}).then(() => {
          // @ts-ignore
          const isUndefined = Cypress.config('unserializable')

          expect(isUndefined).to.be.undefined
        })
      })

      it('does not overwrite unserializable values in the primary when unserializable values of same key exist in secondary', () => {
        // @ts-ignore
        Cypress.config('unserializable', unserializableFunc)
        cy.switchToDomain('foobar.com', () => {
          const unserializableFuncSecondary = () => undefined

          // @ts-ignore
          Cypress.config('unserializable', unserializableFuncSecondary)
        })

        cy.wrap({}).then(() => {
          // @ts-ignore
          const isFunc = Cypress.config('unserializable')

          expect(isFunc).to.equal(unserializableFunc)
        })
      })

      it('does not try to merge objects that contain unserializable values', () => {
        const someUnserializableObj = {
          a: 1,
          b: document.createElement('h1'),
        }

        // @ts-ignore
        Cypress.config('unserializable', someUnserializableObj)

        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const doesNotContainPartialAProperty = Cypress.config('unserializable')

          // @ts-ignore
          expect(doesNotContainPartialAProperty?.a).to.be.undefined

          // @ts-ignore
          Cypress.config('unserializable', {
            a: 3,
            c: document.createElement('h1'),
          })
        })

        cy.wrap({}).then(() => {
          // @ts-ignore
          const isSomeUnserializableObj = Cypress.config('unserializable')

          // @ts-ignore
          expect(isSomeUnserializableObj.a).to.equal(1)
        })
      })

      context('structuredClone()', () => {
        it('(firefox) uses native structuredClone in firefox and does NOT serialize Error objects in config', {
          browser: 'firefox',
        }, function () {
          /**
           * NOTE: structuredClone() was introduced in Firefox 94. Supported versions below 94 need to use the ponyfill
           * to determine whether or not a value can be serialized through postMessage. Since the ponyfill deems Errors
           * as clonable, but postMessage does not in Firefox, this test will fail and will fail all subsequent tests since the
           * config is not serializable.
           *
           * The likelihood that a user is going to be placing Error objects in Cypress.config() or Cypress.env() in versions of Firefox 93 and below
           * is rare. That being said, for Firefox versions below 94, this test will be skipped.
           */
          if (Cypress.browser.majorVersion < 94) {
            this.skip()
          }

          // @ts-ignore
          Cypress.config('errorInConfig', new Error('error'))

          cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
            const isUndefined = Cypress.config('errorInConfig')

            expect(isUndefined).to.be.undefined
          })
        })

        // NOTE: chrome 98 and above uses a native structuredClone() method, but that method CAN clone Error objects
        it('(chromium) uses ponyfilled or native structuredClone that can serialize Error objects in config', {
          browser: ['electron', 'chrome', 'chromium', 'edge'],
        }, () => {
          // @ts-ignore
          Cypress.config('errorInConfig', new Error('error'))

          cy.switchToDomain('foobar.com', () => {
            // @ts-ignore
            const isErrorObj = Cypress.config('errorInConfig')

            expect(isErrorObj).to.be.an.instanceof(Error)
          })
        })
      })
    })
  })

  context('Cypress.env()', () => {
    context('serializable', () => {
      it('syncs initial env from the primary domain to the secondary', () => {
        // @ts-ignore
        Cypress.env('foo', 'bar')
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const isBar = Cypress.env('foo')

          expect(isBar).to.equal('bar')
        })
      })

      it('syncs serializable values in the env again to the secondary even after spec bridge is created', () => {
        // @ts-ignore
        Cypress.env('foo', 'baz')
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const baz = Cypress.env('foo')

          expect(baz).to.equal('baz')
        })
      })

      it('syncs serializable env values outwards from secondary', () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          Cypress.env('bar', 'baz')
        })

        // @ts-ignore
        Cypress.env('bar', 'foo')

        cy.wrap({}).then(() => {
          // @ts-ignore
          const baz = Cypress.env('bar')

          expect(baz).to.equal('baz')
        })
      })

      it('persists env changes made in the secondary, assuming primary has not overwritten with a serializable value', () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const baz = Cypress.env('bar')

          expect(baz).to.equal('baz')
        })
      })

      it('does NOT sync env changes made in the secondary after the command queue is finished and the callback window is closed', {
        // @ts-ignore
        env: {
          baz: undefined,
        },
      }, (done) => {
        cy.switchToDomain('foobar.com', () => {
          setTimeout(() => {
            // this value STILL gets set, but will be blown away on the next switchToDomain with whatever exists in the primary
            // @ts-ignore
            Cypress.env('baz', 'qux')
          }, 100)

          // @ts-ignore
          Cypress.env('baz', 'quux')
        })

        // @ts-ignore
        const isUndefined = Cypress.env('baz')

        expect(isUndefined).to.be.undefined

        cy.wrap({}).then(() => {
          // @ts-ignore
          const isQuux = Cypress.env('baz')

          expect(isQuux).to.equal('quux')
          done()
        })
      })

      it('overwrites different values in secondary if one exists in the primary', {
        // @ts-ignore
        env: {
          baz: 'quux',
        },
      }, () => {
        cy.switchToDomain('foobar.com', () => {
          // in previous test, 'baz' was set to 'qux' after the callback window was closed.
          // this should be overwritten by 'quux' that exists in the primary
          // @ts-ignore
          const isNowQuux = Cypress.env('baz')

          expect(isNowQuux).to.equal('quux')
        })
      })

      it('overwrites different values in secondary, even if the env value does not exist in the primary', {
        // @ts-ignore
        env: {
          baz: undefined,
        },
      }, () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const isNowUndefined = Cypress.env('baz')

          expect(isNowUndefined).to.be.undefined
        })
      })
    })

    context('unserializable', () => {
      const unserializableFunc = () => undefined

      it('does not sync unserializable values from the primary to the secondary', () => {
        // @ts-ignore
        Cypress.env('unserializable', unserializableFunc)
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const isUndefined = Cypress.env('unserializable')

          expect(isUndefined).to.be.undefined
        })
      })

      it('does not overwrite unserializable values in the primary when none exist in the secondary', () => {
        // @ts-ignore
        Cypress.env('unserializable', unserializableFunc)
        cy.switchToDomain('foobar.com', () => undefined)

        // @ts-ignore
        const isFunc = Cypress.env('unserializable')

        expect(isFunc).to.equal(unserializableFunc)
      })

      it('overwrites unserializable values in the primary when serializable values of same key exist in secondary', () => {
        // @ts-ignore
        Cypress.env('unserializable', unserializableFunc)
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          Cypress.env('unserializable', undefined)
        })

        cy.wrap({}).then(() => {
          // @ts-ignore
          const isNowUndefined = Cypress.env('undefined')

          expect(isNowUndefined).to.be.undefined
        })
      })

      it('overwrites unserializable values in the secondary when serializable values of same key exist in primary', () => {
        cy.switchToDomain('foobar.com', () => {
          const unserializableFuncSecondary = () => undefined

          // @ts-ignore
          Cypress.env('unserializable', unserializableFuncSecondary)
        })

        cy.wrap({}).then(() => {
          // @ts-ignore
          Cypress.env('unserializable', undefined)
        })

        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const isUndefined = Cypress.env('unserializable')

          expect(isUndefined).to.be.undefined
        })

        cy.wrap({}).then(() => {
          // @ts-ignore
          const isUndefined = Cypress.env('unserializable')

          expect(isUndefined).to.be.undefined
        })
      })

      it('does not overwrite unserializable values in the primary when unserializable values of same key exist in secondary', () => {
        // @ts-ignore
        Cypress.env('unserializable', unserializableFunc)
        cy.switchToDomain('foobar.com', () => {
          const unserializableFuncSecondary = () => undefined

          // @ts-ignore
          Cypress.env('unserializable', unserializableFuncSecondary)
        })

        cy.wrap({}).then(() => {
          // @ts-ignore
          const isFunc = Cypress.env('unserializable')

          expect(isFunc).to.equal(unserializableFunc)
        })
      })

      it('does not try to merge objects that contain unserializable values', () => {
        const someUnserializableObj = {
          a: 1,
          b: document.createElement('h1'),
        }

        // @ts-ignore
        Cypress.env('unserializable', someUnserializableObj)

        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          const doesNotContainPartialAProperty = Cypress.env('unserializable')

          // @ts-ignore
          expect(doesNotContainPartialAProperty?.a).to.be.undefined

          // @ts-ignore
          Cypress.env('unserializable', {
            a: 3,
            c: document.createElement('h1'),
          })
        })

        cy.wrap({}).then(() => {
          // @ts-ignore
          const isSomeUnserializableObj = Cypress.env('unserializable')

          // @ts-ignore
          expect(isSomeUnserializableObj.a).to.equal(1)
        })
      })

      context('structuredClone()', () => {
        it('(firefox) uses native structuredClone in firefox and does NOT serialize Error objects in env', {
          browser: 'firefox',
        }, function () {
          /**
           * NOTE: structuredClone() was introduced in Firefox 94. Supported versions below 94 need to use the ponyfill
           * to determine whether or not a value can be serialized through postMessage. Since the ponyfill deems Errors
           * as clonable, but postMessage does not in Firefox, this test will fail and will fail all subsequent tests since the
           * config is not serializable.
           *
           * The likelihood that a user is going to be placing Error objects in Cypress.config() or Cypress.env() in versions of Firefox 93 and below
           * is rare. That being said, for Firefox versions below 94, this test will be skipped.
           */
          if (Cypress.browser.majorVersion < 94) {
            this.skip()
          }

          // @ts-ignore
          Cypress.env('errorInEnv', new Error('error'))

          cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
            const isUndefined = Cypress.env('errorInEnv')

            expect(isUndefined).to.be.undefined
          })
        })

        // NOTE: chrome 98 and above uses a native structuredClone() method, but that method CAN clone Error objects
        it('(chromium) uses ponyfilled or native structuredClone that can serialize Error objects in env', {
          browser: ['electron', 'chrome', 'chromium', 'edge'],
        }, () => {
          // @ts-ignore
          Cypress.env('errorInEnv', new Error('error'))

          cy.switchToDomain('foobar.com', () => {
            // @ts-ignore
            const isErrorObj = Cypress.env('errorInEnv')

            expect(isErrorObj).to.be.an.instanceof(Error)
          })
        })
      })
    })
  })
})
