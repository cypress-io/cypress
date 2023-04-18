/// <reference types="cypress" />

describe('dynamic imports', () => {
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
      console.log(mod)
      cy.stub(mod, 'camelCase').callsFake((str: string) => str.toUpperCase())
      const result = mod.camelCase('foo_bar')

      expect(result).to.eq('FOO_BAR')
    })
  })
})
