describe('restore function is nulled out after a no-override test, preventing stale replays', () => {
  it('test-level override applies the specified key for the test body', { expose: { x: 'A' } }, () => {
    expect(Cypress.expose('x')).to.eq('A')
  })

  it('no-override test sees the prior key restored to its pre-override value', () => {
    expect(Cypress.expose('x')).to.eq(undefined)
    Cypress.expose('x', 'set-in-between')
  })

  it('runtime expose set in a no-override test is not cleared when the next test has overrides', { expose: { y: 'C' } }, () => {
    // a stale restore from the first test would have deleted x before this test started
    expect(Cypress.expose('x')).to.eq('set-in-between')
    expect(Cypress.expose('y')).to.eq('C')
  })
})
