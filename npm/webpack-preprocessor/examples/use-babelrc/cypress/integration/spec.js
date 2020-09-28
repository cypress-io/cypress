/// <reference types="cypress" />
describe('Use .babelrc', () => {
  it('handles nullish operator', () => {
    const data = {
      person: {
        firstName: 'Joe'
      }
    }
    const name = data.person.firstName ?? 'Anonymous'
    expect(name).to.equal('Joe')
  })
})
