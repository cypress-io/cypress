// https://github.com/cypress-io/cypress/issues/29668

type PrivilegedBackendCall = {
  args: import('sinon').SinonSpyCall['args']
}

describe('issue #29668 - large path based selectFile', () => {
  it('should select a large file from disk without using the privileged socket response', () => {
    const sizeInMb = 256
    const fileName = `issue-29668-${sizeInMb}mb.bin`
    const expectedSize = sizeInMb * 1024 * 1024
    const backend = cy.stub(Cypress, 'backend').callThrough()

    cy.visit('/fixtures/files-form.html')

    cy.task<string>('create:large:file', { fileName, sizeInMb })
    .then((filePath) => {
      cy.get('#basic').selectFile(filePath)
    })

    cy.get('#basic').should('include.value', fileName)

    cy.get<HTMLInputElement>('#basic').then(($input) => {
      const input = $input[0]
      const file = input.files?.[0]
      const selectFilePrivilegedCalls = backend.getCalls().filter((
        call: PrivilegedBackendCall,
      ) => {
        return call.args[0] === 'run:privileged' && call.args[1]?.commandName === 'selectFile'
      })

      expect(input.files?.length).to.eq(1)
      expect(file?.name).to.eq(fileName)
      expect(file?.size).to.eq(expectedSize)
      expect(selectFilePrivilegedCalls.length).to.eq(0)
    })
  })
})
