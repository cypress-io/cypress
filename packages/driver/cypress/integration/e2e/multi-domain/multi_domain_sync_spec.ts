// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain - sync', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  const SECONDARY_DOMAIN = 'foobar.com'

  before(() => {
    // NOTE: force the spec bridge to be recreated before this test is run to deterministically test config sync
    // @ts-ignore
    window.top.document.querySelector(`[id="Spec Bridge: ${SECONDARY_DOMAIN}"]`)?.remove()
  })

  beforeEach(() => {
    // set an example serializable and unserializable value to validate multi-domain config/env syncing on initial spec bridge creation
    // @ts-ignore
    Cypress.config('foo', 'bar')
    Cypress.env('foo', 'bar')
    // @ts-ignore
    Cypress.config('unserializable', () => {})
    Cypress.env('unserializable', () => {})

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  context('Cypress.config()', () => {
    it('syncs config initially, carrying values set in the primary over to the secondary', () => {
      cy.switchToDomain(SECONDARY_DOMAIN, () => {
        // @ts-ignore
        const bar = Cypress.config('foo')

        expect(bar).to.equal('bar')
      })
    })

    it('does not sync config again to the secondary, causing primary domain configuration changes after spec bridge creation to not update in the secondary', () => {
      // @ts-ignore
      Cypress.config('foo', 'baz')

      cy.switchToDomain(SECONDARY_DOMAIN, () => {
        // @ts-ignore
        const bar = Cypress.config('foo')

        expect(bar).to.equal('bar')
      })
    })

    it('does not sync config outwards from secondary', () => {
      cy.switchToDomain(SECONDARY_DOMAIN, () => {
        // @ts-ignore
        Cypress.config('bar', 'baz')
      })

      // @ts-ignore
      const isUndefined = Cypress.config('bar')

      expect(isUndefined).to.be.undefined
    })

    it('persists configuration changes made in the secondary to other calls to the same domain', () => {
      cy.switchToDomain(SECONDARY_DOMAIN, () => {
        // @ts-ignore
        const baz = Cypress.config('bar')

        expect(baz).to.equal('baz')
      })
    })

    it('sets unserializable values in primary to undefined when synced with the secondary', () => {
      cy.switchToDomain(SECONDARY_DOMAIN, () => {
        // @ts-ignore
        const isUndefined = Cypress.config('unserializable')

        expect(isUndefined).to.be.undefined
      })
    })
  })

  context('Cypress.env()', () => {
    it('syncs env initially, carrying values set in the primary over to the secondary', () => {
      cy.switchToDomain(SECONDARY_DOMAIN, () => {
        // @ts-ignore
        const bar = Cypress.env('foo')

        expect(bar).to.equal('bar')
      })
    })

    it('does not sync env again to the secondary, causing primary domain configuration changes after spec bridge creation to not update in the secondary', () => {
      // @ts-ignore
      Cypress.env('foo', 'baz')

      cy.switchToDomain(SECONDARY_DOMAIN, () => {
        // @ts-ignore
        const bar = Cypress.env('foo')

        expect(bar).to.equal('bar')
      })
    })

    it('does not sync config outwards from secondary', () => {
      cy.switchToDomain(SECONDARY_DOMAIN, () => {
        // @ts-ignore
        Cypress.env('bar', 'baz')
      })

      // @ts-ignore
      const isUndefined = Cypress.config('bar')

      expect(isUndefined).to.be.undefined
    })

    it('persists configuration changes made in the secondary to other calls to the same domain', () => {
      cy.switchToDomain(SECONDARY_DOMAIN, () => {
        // @ts-ignore
        const baz = Cypress.env('bar')

        expect(baz).to.equal('baz')
      })
    })

    it('sets unserializable values in primary to undefined when synced with the secondary', () => {
      cy.switchToDomain(SECONDARY_DOMAIN, () => {
        // @ts-ignore
        const isUndefined = Cypress.env('unserializable')

        expect(isUndefined).to.be.undefined
      })
    })
  })
})
