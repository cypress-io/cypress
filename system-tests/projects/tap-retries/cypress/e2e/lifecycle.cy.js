// The tap run-lifecycle spec rewrites this file mid-test to make the watcher
// rerun it, so the test count here is what "the first run" is recognized by.
describe('Lifecycle', () => {
  it('is the first test', () => {
    expect(true).to.eq(true)
  })

  it('is the second test', () => {
    expect(true).to.eq(true)
  })
})
