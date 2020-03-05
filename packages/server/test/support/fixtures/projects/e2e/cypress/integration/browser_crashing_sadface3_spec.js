describe('e2e browser sadface3 spec', () => {
  it('freezes the browser', () => {
    return Cypress.automation('remote:debugger:protocol', {
      command: 'Page.crash',
    })
  })
})
