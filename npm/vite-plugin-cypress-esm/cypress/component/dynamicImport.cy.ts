/// <reference types="cypress" />

import _ from 'lodash'

describe('dynamic imports', () => {
  it('uses real implementation', () => {
    expect(_.add(1, 2)).to.eq(3)
  })

  it('mocks', () => {
    cy.stub(_, 'add').callsFake(function multiply (a: number, b: number) {
      return a * b
    })

    // Plot twist - add actually does multiplication!
    expect(_.add(1, 2)).to.eq(2)
  })

  it('uses real implementation again', () => {
    expect(_.add(1, 2)).to.eq(3)
  })

  it('stubs lodash method from node_modules using dynamic import', () => {
    let done = false

    async function run () {
      const _ = await import('lodash')

      cy.stub(_, 'camelCase').callsFake((str: string) => str.toUpperCase())
      const result = _.camelCase('foo_bar')

      expect(result).to.eq('FOO_BAR')

      done = true
    }

    cy.wrap(run()).then(() => {
      expect(done).to.be.true
    })
  })

  it('stub local dynamic import', () => {
    let called = false

    async function run () {
      const mod = await import('./fixtures/add')

      cy.stub(mod, 'add')
      mod.add(1, 2)
      called = true
    }

    cy.wrap(run()).then(() => {
      expect(called).to.be.true
    })
  })

  it('stubs lodash method from node_modules using `then`', () => {
    import('lodash').then((mod) => {
      cy.stub(mod, 'camelCase').callsFake((str: string) => str.toUpperCase())

      const result = mod.camelCase('foo_bar')

      expect(result).to.eq('FOO_BAR')
    })
  })

  it('destructures', () => {
    async function run () {
      const { add } = await import('lodash')

      expect(add(1, 2)).to.eq(3)
    }

    cy.wrap(run())
  })

  it('ignores import-like functions', async () => {
    /*
     * This test will probably explode due to malformed syntax if the exclusion logic isn't working,
     * so the assertion here isn't really necessary but helps mark as a passing test
     */

    const importLike = await import('./fixtures/import-like')

    expect(importLike.custom_import('abc')).to.eql('123abc')
  })
})
