describe('invocationDetails', () => {
  let tests = []

  before(() => {
    cy.on('test:before:run:async', (attr, test) => {
      tests.push(test)
    })
  })

  it('has the correct file, line, and column numbers', () => {
    expect(tests).to.have.length(1)

    const { fileUrl, originalFile, relativeFile, line, column } = tests[0]?.invocationDetails

    expect(fileUrl).to.eq('http://localhost:2121/__cypress/tests?p=cypress/e2e/block_codepoints.cy.js')
    expect(relativeFile).to.eq('cypress/e2e/block_codepoints.cy.js')
    expect(originalFile).to.eq('webpack://invocation-details/./cypress/e2e/block_codepoints.cy.js')
    expect(line).to.eq(10)
    expect(column).to.eq(3)
  })
})
