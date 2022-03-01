['config', 'env'].forEach((fnName) => {
  // @ts-ignore
  describe(`multi-domain - Cypress.${fnName}()`, { experimentalSessionSupport: true }, () => {
    const USED_KEYS = {
      foo: 'multi-domain-foo',
      bar: 'multi-domain-bar',
      baz: 'multi-domain-baz',
      qux: 'multi-domain-qux',
      quux: 'multi-domain-quux',
      unserializable: 'multi-domain-unserializable',
      error: 'multi-domain-error',
    }

    beforeEach(() => {
      cy.visit('/fixtures/multi-domain.html')
      cy.get('a[data-cy="multi-domain-secondary-link"]').click()
    })

    afterEach(() => {
      // @ts-ignore
      window.top.__cySkipValidateConfig = true
    })

    if (fnName === 'config') {
      it(`throws if mutating read-only config values with Cypress.config()`, () => {
        return new Promise<void>((resolve) => {
          // @ts-ignore
          window.top.__cySkipValidateConfig = false
          cy.on('fail', (err) => {
            expect(err.message).to.include('`Cypress.config()` cannot mutate option `chromeWebSecurity` because it is a read-only property.')
            resolve()
          })

          cy.switchToDomain('foobar.com', () => {
            // @ts-ignore
            Cypress.config('chromeWebSecurity', false)
          })
        })
      })
    }

    context('serializable', () => {
      it(`syncs initial Cypress.${fnName}() from the primary domain to the secondary (synchronously)`, () => {
        Cypress[fnName](USED_KEYS.foo, 'bar')
        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          const bar = Cypress[fnName](USED_KEYS.foo)

          expect(bar).to.equal('bar')
        })
      })

      it(`syncs serializable values in the Cypress.${fnName}() again to the secondary even after spec bridge is created`, () => {
        Cypress[fnName](USED_KEYS.foo, 'baz')
        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          const baz = Cypress[fnName](USED_KEYS.foo)

          expect(baz).to.equal('baz')
        })
      })

      it(`syncs serializable Cypress.${fnName}() values outwards from secondary (synchronously)`, () => {
        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          Cypress[fnName](USED_KEYS.bar, 'baz')
        }).then(() => {
          const baz = Cypress[fnName](USED_KEYS.bar)

          expect(baz).to.equal('baz')
        })
      })

      it(`syncs serializable Cypress.${fnName}() values outwards from secondary even if the value is undefined`, () => {
        // @ts-ignore
        Cypress[fnName](USED_KEYS.foo, 'bar')

        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          Cypress[fnName](USED_KEYS.foo, undefined)
        }).then(() => {
          expect(Cypress[fnName]('foo')).to.be.undefined
        })
      })

      it(`syncs serializable Cypress.${fnName}() values outwards from secondary (commands/async)`, () => {
        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          cy.then(() => {
            // @ts-ignore
            Cypress[fnName](USED_KEYS.bar, 'quux')
          })
        }).then(() => {
          const quux = Cypress[fnName](USED_KEYS.bar)

          expect(quux).to.equal('quux')
        })
      })

      it(`persists Cypress.${fnName}() changes made in the secondary, assuming primary has not overwritten with a serializable value`, () => {
        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          const quux = Cypress[fnName](USED_KEYS.bar)

          expect(quux).to.equal('quux')
        })
      })

      it(`does NOT sync Cypress.${fnName}() changes made in the secondary after the command queue is finished and the callback window is closed`, {
        [USED_KEYS.baz]: undefined,
        env: {
          [USED_KEYS.baz]: undefined,
        },
      }, () => {
        return new Promise<void>((resolve) => {
          cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
            setTimeout(() => {
              // this value STILL gets set, but will be blown away on the next switchToDomain with whatever exists in the primary
              // @ts-ignore
              Cypress[fnName](USED_KEYS.baz, 'qux')
            }, 100)

            // @ts-ignore
            Cypress[fnName](USED_KEYS.baz, 'quux')
          }).then(() => {
            const quux = Cypress[fnName](USED_KEYS.baz)

            expect(quux).to.equal('quux')
            resolve()
          })
        })
      })

      it('overwrites different values in secondary if one exists in the primary', {
        // @ts-ignore
        [USED_KEYS.baz]: 'quux',
        env: {
          [USED_KEYS.baz]: 'quux',
        },
      }, () => {
        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // in previous test, 'baz' was set to 'qux' after the callback window was closed.
          // this should be overwritten by 'quux' that exists in the primary
          // @ts-ignore
          const quux = Cypress[fnName](USED_KEYS.baz)

          expect(quux).to.equal('quux')
        })
      })

      it(`overwrites different values in secondary, even if the Cypress.${fnName}() value does not exist in the primary`, {
        // @ts-ignore
        [USED_KEYS.baz]: undefined,
        env: {
          [USED_KEYS.baz]: undefined,
        },
      }, () => {
        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          const isNowUndefined = Cypress[fnName](USED_KEYS.baz)

          expect(isNowUndefined).to.be.undefined
        })
      })
    })

    context('unserializable', () => {
      const unserializableFunc = () => undefined

      it('does not sync unserializable values from the primary to the secondary', () => {
        Cypress[fnName](USED_KEYS.unserializable, unserializableFunc)
        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          const isUndefined = Cypress[fnName](USED_KEYS.unserializable)

          expect(isUndefined).to.be.undefined
        })
      })

      it('does not overwrite unserializable values in the primary when none exist in the secondary', () => {
        Cypress[fnName](USED_KEYS.unserializable, unserializableFunc)
        cy.switchToDomain('foobar.com', () => undefined)

        const isFunc = Cypress[fnName](USED_KEYS.unserializable)

        expect(isFunc).to.equal(unserializableFunc)
      })

      it('overwrites unserializable values in the primary when serializable values of same key exist in secondary', () => {
        Cypress[fnName](USED_KEYS.unserializable, unserializableFunc)
        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          Cypress[fnName](USED_KEYS.unserializable, undefined)
        }).then(() => {
          const isNowUndefined = Cypress[fnName](USED_KEYS.unserializable)

          expect(isNowUndefined).to.be.undefined
        })
      })

      it('overwrites unserializable values in the secondary when serializable values of same key exist in primary', () => {
        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          const unserializableFuncSecondary = () => undefined

          // @ts-ignore
          Cypress[fnName](USED_KEYS.unserializable, unserializableFuncSecondary)
        }).then(() => {
          Cypress[fnName](USED_KEYS.unserializable, undefined)
        })

        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          const isUndefined = Cypress[fnName](USED_KEYS.unserializable)

          expect(isUndefined).to.be.undefined
        }).then(() => {
          const isUndefined = Cypress[fnName](USED_KEYS.unserializable)

          expect(isUndefined).to.be.undefined
        })
      })

      it('does not overwrite unserializable values in the primary when unserializable values of same key exist in secondary', () => {
        Cypress[fnName](USED_KEYS.unserializable, unserializableFunc)
        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          const unserializableFuncSecondary = () => undefined

          // @ts-ignore
          Cypress[fnName](USED_KEYS.unserializable, unserializableFuncSecondary)
        }).then(() => {
          const isFunc = Cypress[fnName](USED_KEYS.unserializable)

          expect(isFunc).to.equal(unserializableFunc)
        })
      })

      it('does not try to merge objects that contain unserializable values', () => {
        const partiallyUnserializableObject = {
          a: 1,
          b: document.createElement('h1'),
        }

        Cypress[fnName](USED_KEYS.unserializable, partiallyUnserializableObject)

        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          const doesNotContainPartialAProperty = Cypress[fnName](USED_KEYS.unserializable)

          expect(doesNotContainPartialAProperty?.a).to.be.undefined

          // @ts-ignore
          Cypress[fnName](USED_KEYS.unserializable, {
            a: 3,
            c: document.createElement('h1'),
          })
        }).then(() => {
          const isPartiallyUnserializableObject = Cypress[fnName](USED_KEYS.unserializable)

          expect(isPartiallyUnserializableObject.a).to.equal(1)
        })
      })
    })

    context('structuredClone()', () => {
      it('(firefox) uses native structuredClone in firefox and does NOT serialize Error objects in config', {
        browser: 'firefox',
      }, function () {
        Cypress[fnName](USED_KEYS.error, new Error('error'))

        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          const isUndefined = Cypress[fnName](USED_KEYS.error)

          expect(isUndefined).to.be.undefined
        })
      })

      // NOTE: chrome 98 and above uses a native structuredClone() method, but that method CAN clone Error objects
      it('(chromium) uses ponyfilled or native structuredClone that can serialize Error objects in config', {
        browser: { family: 'chromium' },
      }, () => {
        Cypress[fnName](USED_KEYS.error, new Error('error'))

        cy.switchToDomain('foobar.com', [fnName, USED_KEYS], ([fnName, USED_KEYS]) => {
          // @ts-ignore
          const isErrorObj = Cypress[fnName](USED_KEYS.error)

          expect(isErrorObj).to.be.an.instanceof(Error)
        })
      })
    })
  })
})
