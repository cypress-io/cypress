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
    async function run () {
      const _ = await import('lodash')

      cy.stub(_, 'camelCase').callsFake((str: string) => str.toUpperCase())
      const result = _.camelCase('foo_bar')

      expect(result).to.eq('FOO_BAR')
    }

    cy.wrap(run())
  })

  it('stubs lodash method from node_modules using `then`', () => {
    import('lodash').then((mod) => {
      cy.stub(mod, 'camelCase').callsFake((str: string) => str.toUpperCase())

      const result = mod.camelCase('foo_bar')

      expect(result).to.eq('FOO_BAR')
    })
  })
})
