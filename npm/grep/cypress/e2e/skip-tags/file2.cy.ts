describe('Spec 2', { tags: ['@tag2'] }, () => {
  // NOTE: This skipped test is tagged (via its suite) with @tag2. When
  // filtering by @tag1 with grepOmitFiltered, it must be omitted from the
  // results just like the active sibling test. Regression test for
  // https://github.com/cypress-io/cypress/issues/24455
  it.skip('Spec 2 - Test 1', () => {
    expect(true).to.equal(true)
  })

  it('Spec 2 - Test 2', () => {
    expect(true).to.equal(true)
  })
})
