// A suite whose only test was filtered out must not run its before(): mocha runs the hooks of any
// suite that still has a registered test, and a skipped test counts, so the hook used to fire for
// tests that grepOmitFiltered had been asked to leave out.  The flag is asserted from a suite that
// does run, because nothing inside the filtered suite can report.
let filteredHookRan = false

describe('Suite whose only test is filtered out', { tags: ['@excluded'] }, () => {
  before(() => {
    filteredHookRan = true
  })

  // NOTE: the skip is the point of this fixture. The suite's only test is both skipped and
  // filtered out, which is the combination that used to run the before() regardless.
  it.skip('is skipped and does not match the filter', () => {})
})

describe('Suite that runs', { tags: ['@included'] }, () => {
  it('leaves the filtered suite\'s before() alone', () => {
    expect(filteredHookRan).to.equal(false)
  })
})
