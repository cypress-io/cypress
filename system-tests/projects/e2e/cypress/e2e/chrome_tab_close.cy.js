it('closes the chrome tab', () => {
  return Cypress.automation('remote:debugger:protocol', {
    command: 'Target.getTargets',
  })
  .then(({ targetInfos = [] }) => {
    const url = top.location.href

    const target = targetInfos.find((target) => target.url === url)

    return Cypress.automation('remote:debugger:protocol', {
      command: 'Target.closeTarget',
      params: {
        targetId: target.targetId,
      },
    })
  })
})
