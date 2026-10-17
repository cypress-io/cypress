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
  // never settle, so the test can't report a pass before the tab finishes closing
  .then(() => new Promise(() => {}))
})
