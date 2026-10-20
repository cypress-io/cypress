it('closes the chrome tab', () => {
  return Cypress.automation('remote:debugger:protocol', {
    command: 'Target.getTargets',
  })
  .then(({ targetInfos = [] }) => {
    const url = top.location.href

    const target = targetInfos.find((target) => target.url === url)

    Cypress.automation('remote:debugger:protocol', {
      command: 'Target.closeTarget',
      params: {
        targetId: target.targetId,
      },
    })

    // closeTarget can resolve before the server notices the tab is gone, and a
    // test that finishes first prints a passing line the snapshot doesn't have
    return new Promise(() => {})
  })
  // never settle, so the test can't report a pass before the tab finishes closing
  .then(() => new Promise(() => {}))
})
