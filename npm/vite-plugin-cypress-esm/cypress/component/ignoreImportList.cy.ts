// This import path should match `ignoreImportPath` and be ignored
import * as Immutable from './fixtures/ImmutableModuleB'

describe('ignoreImportList', () => {
  it('ignored import is not proxified and cannot be stubbed', () => {
    let called = false

    try {
      cy.stub(Immutable, 'unstubbable')
    } catch (e) {
      expect(e.message).to.eq('ES Modules cannot be stubbed')
      called = true
    }
    expect(called).to.be.true
  })
})
