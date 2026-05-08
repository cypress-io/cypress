describe('tests that use .each work', () => {
  // creating tests dynamically works with "cypress-grep"
  const testCases = [1, 2, 3]

  testCases.forEach((x) => {
    it(`test for ${x}`, () => {
      expect(x).to.be.oneOf([1, 2, 3])
    })
  })
})
