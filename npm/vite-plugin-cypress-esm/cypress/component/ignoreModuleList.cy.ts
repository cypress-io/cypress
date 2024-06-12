// The referenced module should be ignored due to `ignoreModuleList` entry
import * as Immutable from './fixtures/ImmutableModuleA'

describe('ignoreModuleList', () => {
  it('ignored module is not proxified and cannot be stubbed', () => {
    let called = false

    try {
      cy.stub(Immutable, 'unstubbable')
    } catch (e) {
      expect(e.message).to.eq('ES Modules cannot be stubbed')
      called = true
    }
    expect(called).to.be.true
  })

  it('ignored module is not proxified and cannot be spied', () => {
    let called = false

    try {
      cy.stub(Immutable, 'default')
    } catch (e) {
      expect(e.message).to.eq('ES Modules cannot be stubbed')
      called = true
    }
    expect(called).to.be.true
  })

  it('correctly ignores dynamic imports', () => {
    let called = false

    async function run () {
      const mod = await import('./fixtures/MyAsyncMod')

      try {
        cy.stub(mod, 'default')
        mod.default()
      } catch (e) {
        called = true
        expect(e.message).to.eq('ES Modules cannot be stubbed')
      }
    }

    cy.wrap(run()).then(() => {
      expect(called).to.be.true
    })
  })
})
