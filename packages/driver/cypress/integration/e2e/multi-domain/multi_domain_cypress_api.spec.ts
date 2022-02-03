// @ts-ignore / session support is needed for visiting about:blank between tests+
describe('multi-domain Cypress API', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  context('Commands', () => {
    context('add', () => {
      it('adds a custom command', () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          Cypress.Commands.add('foo', () => {
            return cy.wrap('bar')
          })

          // @ts-ignore
          cy.foo().then((shouldBeBar) => {
            expect(shouldBeBar).to.equal('bar')
          })
        })
      })

      it('persists defined commands through spec bridge', () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          cy.foo().then((shouldBeBar) => {
            expect(shouldBeBar).to.equal('bar')
          })
        })
      })
    })

    context('overwrite', () => {
      it('overwrites an existing command in the spec bridge', () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          Cypress.Commands.overwrite('foo', () => {
            return cy.wrap('baz')
          })

          // @ts-ignore
          cy.foo().then((shouldBeBaz) => {
            expect(shouldBeBaz).to.equal('baz')
          })
        })
      })

      it('persists overwritten command through spec bridge', () => {
        cy.switchToDomain('foobar.com', () => {
          // @ts-ignore
          cy.foo().then((shouldBeBaz) => {
            expect(shouldBeBaz).to.equal('baz')
          })
        })
      })
    })
  })

  context('Keyboard', () => {
    it('does NOT sync defaults', () => {
      const defaults = Cypress.Keyboard.defaults({
        keystrokeDelay: 30,
      })

      cy.switchToDomain('foobar.com', [defaults], ([primaryKeyboardDefaults]) => {
        const multiDomainKeyboardDefaults = Cypress.Keyboard.defaults({})

        expect(multiDomainKeyboardDefaults).to.not.deep.equal(primaryKeyboardDefaults)
      })
    })

    it('allows a user to configure defaults', () => {
      cy.switchToDomain('foobar.com', () => {
        const multiDomainKeyboardDefaults = Cypress.Keyboard.defaults({
          keystrokeDelay: 60,
        })

        expect(multiDomainKeyboardDefaults).to.deep.include({
          keystrokeDelay: 60,
        })
      })
    })

    it('persists default configuration changes through spec bridge', () => {
      cy.switchToDomain('foobar.com', () => {
        const multiDomainKeyboardDefaults = Cypress.Keyboard.defaults({})

        expect(multiDomainKeyboardDefaults).to.deep.include({
          keystrokeDelay: 60,
        })
      })
    })
  })

  context('Screenshot', () => {
    it('does NOT sync defaults', () => {
      Cypress.Screenshot.defaults({
        blackout: ['foo'],
        overwrite: true,
        onBeforeScreenshot: () => undefined,
        onAfterScreenshot: () => undefined,
      })

      cy.switchToDomain('foobar.com', () => {
        const multiDomainScreenshotDefaults = Cypress.Screenshot.defaults({})

        expect(multiDomainScreenshotDefaults).to.not.deep.include({
          blackout: ['foo'],
          overwrite: true,
          onBeforeScreenshot: () => undefined,
          onAfterScreenshot: () => undefined,
        })
      })
    })

    it('allows a user to configure defaults', () => {
      cy.switchToDomain('foobar.com', () => {
        const multiDomainScreenshotDefaults = Cypress.Screenshot.defaults({
          blackout: ['foo'],
          overwrite: true,
        })

        expect(multiDomainScreenshotDefaults).to.deep.include({
          blackout: ['foo'],
          overwrite: true,
        })
      })
    })

    it('persists default configuration changes through spec bridge', () => {
      cy.switchToDomain('foobar.com', () => {
        const multiDomainScreenshotDefaults = Cypress.Screenshot.defaults({})

        expect(multiDomainScreenshotDefaults).to.deep.include({
          blackout: ['foo'],
          overwrite: true,
        })
      })
    })
  })

  context('dom', () => {
    it('provides a sanity check that the dom API exists on Cypress.*', () => {
      cy.switchToDomain('foobar.com', () => {
        cy.get('[data-cy="dom-check"]').then(($el) => {
          expect(Cypress.dom.isAttached($el)).to.be.true
        })
      })
    })
  })

  // TODO: Before implementing, understand how Cypress.session.* and cy.session() are supposed to function within the context of multi-domain
  context.skip('session', () => {
    it('clearAllSavedSessions() functions as expected', () => {
      cy.switchToDomain('foobar.com', () => {
        Cypress.session.clearAllSavedSessions()
      })
    })
  })

  context('properties', () => {
    it('has arch property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.arch], ([theArch]) => {
        expect(Cypress.arch).to.equal(theArch)
      })
    })

    it('has browser property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.browser], ([theBrowser]) => {
        expect(Cypress.browser).to.deep.equal(theBrowser)
      })
    })

    it('has currentTest property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.currentTest], ([theCurrentTest]) => {
        expect(Cypress.currentTest).to.deep.equal(theCurrentTest)
      })
    })

    it('has platform property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.platform], ([thePlatform]) => {
        expect(Cypress.platform).to.equal(thePlatform)
      })
    })

    it('has testingType property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.testingType], ([theTestingType]) => {
        expect(Cypress.testingType).to.deep.equal(theTestingType)
      })
    })

    it('has spec property synced from primary', () => {
      cy.switchToDomain('foobar.com', [Cypress.spec], ([theSpec]) => {
        expect(Cypress.spec).to.deep.equal(theSpec)
      })
    })
  })

  context('methods', () => {
    it('isCy()', () => {
      cy.switchToDomain('foobar.com', () => {
        expect(Cypress.isCy(cy)).to.be.true
      })
    })

    it('isBrowser()', () => {
      cy.switchToDomain('foobar.com', [Cypress.browser], ([theBrowser]) => {
        expect(Cypress.isBrowser(theBrowser.name)).to.equal(true)
      })
    })

    it('log()', (done) => {
      cy.on('log:changed', (changedLog) => {
        if (changedLog?.message === 'test log' && changedLog.ended) {
          // just make sure Big Cypress logs make their way back to the primary
          done()
        }
      })

      cy.switchToDomain('foobar.com', () => {
        Cypress.log({
          message: 'test log',
        })
      })
    })

    // verifies the config from the primary domain is synced with the secondary (other syncing behavior tested in multi_domain_config_env_spec)
    it('config()', () => {
      const conf = Cypress.config()

      cy.switchToDomain('foobar.com', [conf], ([theConfig]) => {
        const multiDomainConfig = Cypress.config()

        // video is always turned off in switchToDomain
        const primaryConfigWithOmittedProps = _.omit(theConfig, 'video', 'isInteractive', 'env')
        const secondaryConfigWithOmittedProps = _.omit(multiDomainConfig, 'video', 'isInteractive', 'env')

        expect(primaryConfigWithOmittedProps).to.deep.equal(secondaryConfigWithOmittedProps)
      })
    })

    // verifies the env from the primary domain is synced with the secondary (other syncing behavior tested in multi_domain_config_env_spec)
    it('env()', () => {
      Cypress.env('foo', 'bar')

      const env = Cypress.env()

      cy.switchToDomain('foobar.com', [env], ([theEnv]) => {
        const multiDomainEnv = Cypress.env()

        expect(multiDomainEnv).to.deep.equal(theEnv)
      })
    })
  })

  context('not supported', () => {
    it('throws an error when a user attempts to configure Cypress.Server.defaults() inside of multi-domain', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`Cypress.Server.*` has been deprecated and use is forbidden in `cy.switchToDomain()`. Consider migrating to using `cy.intercept()` instead.')
        done()
      })

      cy.switchToDomain('foobar.com', () => {
        Cypress.Server.defaults({})
      })
    })

    it('throws an error when a user attempts to configure Cypress.Cookies.defaults() inside of multi-domain', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`Cypress.Cookies.*` use is forbidden in `cy.switchToDomain()`. Consider using `cy.session()` instead.')
        done()
      })

      cy.switchToDomain('foobar.com', () => {
        Cypress.Cookies.defaults({})
      })
    })
  })
})
