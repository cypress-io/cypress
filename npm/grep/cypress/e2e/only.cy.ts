// Regression specs for https://github.com/cypress-io/cypress/issues/25062
// `it.only` / `describe.only` used to throw
// "Cannot read properties of undefined (reading 'parent')" when @cypress/grep
// was active. These run with grepTags='@smoke' and grepOmitFiltered=true.

describe('tests that use it.only', () => {
  // focused test whose tag matches the grep filter -> runs
  // eslint-disable-next-line mocha/no-exclusive-tests -- exercising .only + grep
  it.only('runs the focused test', { tags: '@smoke' }, () => {
    expect(true).to.be.true
  })

  // not focused and tag does not match the grep filter -> omitted
  it('is filtered out', { tags: '@regression' }, () => {
    expect(true).to.be.true
  })
})

// eslint-disable-next-line mocha/no-exclusive-tests -- exercising .only + grep
describe.only('a focused suite', () => {
  // tag matches the grep filter -> runs
  it('runs because the suite is focused', { tags: '@smoke' }, () => {
    expect(true).to.be.true
  })

  // tag does not match the grep filter -> omitted
  it('is filtered out of the focused suite', { tags: '@regression' }, () => {
    expect(true).to.be.true
  })
})
