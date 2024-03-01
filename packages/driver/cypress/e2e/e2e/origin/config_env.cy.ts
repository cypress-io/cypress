['config', 'env'].forEach((fnName) => {
  describe(`cy.origin- Cypress.${fnName}()`, { browser: '!webkit' }, () => {
    const USED_KEYS = {
      foo: 'cy-origin-foo',
      bar: 'cy-origin-bar',
      baz: 'cy-origin-baz',
      qux: 'cy-origin-qux',
      quux: 'cy-origin-quux',
      unserializable: 'cy-origin-unserializable',
      error: 'cy-origin-error',
    }

    afterEach(() => {
      // @ts-ignore
      window.top.__cySkipValidateConfig = true
    })

    if (fnName === 'config') {
      it(`throws if mutating read-only config values with Cypress.config()`, (done) => {
        // @ts-ignore
        window.top.__cySkipValidateConfig = false
        cy.on('fail', (err) => {
          expect(err.message).to.include('`Cypress.config()` can never override `chromeWebSecurity` because it is a read-only configuration option.')
          done()
        })

        cy.origin('http://www.foobar.com:3500', () => {
          // @ts-ignore
          Cypress.config('chromeWebSecurity', false)
        })
      })
    }

    context('serializable', () => {
      it(`syncs initial Cypress.${fnName}() from the primary origin to the secondary (synchronously)`, () => {
        Cypress[fnName](USED_KEYS.foo, 'bar')
        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          const bar = Cypress[fnName](USED_KEYS.foo)

          expect(bar).to.equal('bar')
        })
      })

      it(`syncs serializable values in the Cypress.${fnName}() again to the secondary even after spec bridge is created`, () => {
        Cypress[fnName](USED_KEYS.foo, 'baz')
        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          const baz = Cypress[fnName](USED_KEYS.foo)

          expect(baz).to.equal('baz')
        })
      })

      it(`syncs serializable Cypress.${fnName}() values outwards from secondary (synchronously)`, () => {
        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          Cypress[fnName](USED_KEYS.bar, 'baz')
        }).then(() => {
          const baz = Cypress[fnName](USED_KEYS.bar)

          expect(baz).to.equal('baz')
        })
      })

      it(`syncs serializable Cypress.${fnName}() values outwards from secondary even if the value is undefined`, () => {
        Cypress[fnName](USED_KEYS.foo, 'bar')

        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          Cypress[fnName](USED_KEYS.foo, undefined)
        }).then(() => {
          expect(Cypress[fnName]('foo')).to.be.undefined
        })
      })

      it(`syncs serializable Cypress.${fnName}() values outwards from secondary (commands/async)`, () => {
        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          cy.then(() => {
            Cypress[fnName](USED_KEYS.bar, 'quux')
          })
        }).then(() => {
          const quux = Cypress[fnName](USED_KEYS.bar)

          expect(quux).to.equal('quux')
        })
      })

      it(`persists Cypress.${fnName}() changes made in the secondary, assuming primary has not overwritten with a serializable value`, () => {
        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
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
          cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
            setTimeout(() => {
              // this value STILL gets set, but will be blown away on the next origin with whatever exists in the primary
              Cypress[fnName](USED_KEYS.baz, 'qux')
            }, 100)

            Cypress[fnName](USED_KEYS.baz, 'quux')
          }).then(() => {
            const quux = Cypress[fnName](USED_KEYS.baz)

            expect(quux).to.equal('quux')
            resolve()
          })
        })
      })

      it('overwrites different values in secondary if one exists in the primary', {
        [USED_KEYS.baz]: 'quux',
        env: {
          [USED_KEYS.baz]: 'quux',
        },
      }, () => {
        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          // in previous test, 'baz' was set to 'qux' after the callback window was closed.
          // this should be overwritten by 'quux' that exists in the primary
          const quux = Cypress[fnName](USED_KEYS.baz)

          expect(quux).to.equal('quux')
        })
      })

      it(`overwrites different values in secondary, even if the Cypress.${fnName}() value does not exist in the primary`, {
        [USED_KEYS.baz]: undefined,
        env: {
          [USED_KEYS.baz]: undefined,
        },
      }, () => {
        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          const isNowUndefined = Cypress[fnName](USED_KEYS.baz)

          expect(isNowUndefined).to.be.undefined
        })
      })
    })

    context('unserializable', () => {
      const unserializableFunc = () => undefined

      it('does not sync unserializable values from the primary to the secondary', () => {
        Cypress[fnName](USED_KEYS.unserializable, unserializableFunc)
        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          const isUndefined = Cypress[fnName](USED_KEYS.unserializable)

          expect(isUndefined).to.be.undefined
        })
      })

      it('does not overwrite unserializable values in the primary when none exist in the secondary', () => {
        Cypress[fnName](USED_KEYS.unserializable, unserializableFunc)
        cy.origin('http://www.foobar.com:3500', () => undefined)

        const isFunc = Cypress[fnName](USED_KEYS.unserializable)

        expect(isFunc).to.equal(unserializableFunc)
      })

      it('overwrites unserializable values in the primary when serializable values of same key exist in secondary', () => {
        Cypress[fnName](USED_KEYS.unserializable, unserializableFunc)
        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          Cypress[fnName](USED_KEYS.unserializable, undefined)
        }).then(() => {
          const isNowUndefined = Cypress[fnName](USED_KEYS.unserializable)

          expect(isNowUndefined).to.be.undefined
        })
      })

      it('overwrites unserializable values in the secondary when serializable values of same key exist in primary', () => {
        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          const unserializableFuncSecondary = () => undefined

          Cypress[fnName](USED_KEYS.unserializable, unserializableFuncSecondary)
        }).then(() => {
          Cypress[fnName](USED_KEYS.unserializable, undefined)
        })

        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          const isUndefined = Cypress[fnName](USED_KEYS.unserializable)

          expect(isUndefined).to.be.undefined
        }).then(() => {
          const isUndefined = Cypress[fnName](USED_KEYS.unserializable)

          expect(isUndefined).to.be.undefined
        })
      })

      it('does not overwrite unserializable values in the primary when unserializable values of same key exist in secondary', () => {
        Cypress[fnName](USED_KEYS.unserializable, unserializableFunc)
        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          const unserializableFuncSecondary = () => undefined

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

        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          const doesNotContainPartialAProperty = Cypress[fnName](USED_KEYS.unserializable)

          expect(doesNotContainPartialAProperty?.a).to.be.undefined

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
      // NOTE: chrome 98 and above uses a native structuredClone() method, but that method CAN clone Error objects
      // NOTE: firefox 114 can now serialize/clone error objects
      it('uses ponyfilled or native structuredClone that can serialize Error objects in config', {
        browser: '!webkit',
      }, () => {
        Cypress[fnName](USED_KEYS.error, new Error('error'))

        cy.origin('http://www.foobar.com:3500', { args: { fnName, USED_KEYS } }, ({ fnName, USED_KEYS }) => {
          const isErrorObj = Cypress[fnName](USED_KEYS.error)

          // We preserve the error structure, but on preprocessing to the spec bridge, the error is converted to a flat object
          expect(isErrorObj).to.be.an.instanceof(Object)
          expect(isErrorObj.message).to.eq('error')
        })
      })
    })
  })
})
