describe('e2e browser sadface1 spec', () => {
  it('freezes the browser', () => {
    return Cypress.automation('remote:debugger:protocol', {
      command: 'Page.crash',
    })
  })
})
