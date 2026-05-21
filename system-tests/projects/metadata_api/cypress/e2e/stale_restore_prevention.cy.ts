describe('restore function is nulled out after a no-override test, preventing stale replays', () => {
  it('test-level override applies the specified key for the test body', { metadata: { x: 'A' } }, () => {
    expect(Cypress.metadata.get('x')).to.eq('A')
  })

  it('no-override test sees the prior key restored to its pre-override value', () => {
    expect(Cypress.metadata.get('x')).to.eq(undefined)
    Cypress.metadata.set('x', 'set-in-between')
  })

  it('runtime metadata set in a no-override test is not cleared when the next test has overrides', { metadata: { y: 'C' } }, () => {
    // a stale restore from the first test would have deleted x before this test started
    expect(Cypress.metadata.get('x')).to.eq('set-in-between')
    expect(Cypress.metadata.get('y')).to.eq('C')
  })
})
