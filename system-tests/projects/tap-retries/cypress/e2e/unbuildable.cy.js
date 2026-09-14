// Unresolvable rather than unparseable, so the file stays valid JavaScript and
// needs no .eslintignore entry to keep lint honest.
import 'this-module-does-not-exist'

describe('Unbuildable', () => {
  it('never gets the chance to run', () => {
    expect(true).to.eq(true)
  })
})
