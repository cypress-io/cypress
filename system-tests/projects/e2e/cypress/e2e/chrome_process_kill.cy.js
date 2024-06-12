it('kills the chrome process', () => {
  return Cypress.automation('remote:debugger:protocol', {
    command: 'Browser.close',
  })
})
