describe('Support files', () => {
  it('can load a support file', () => {
    const $body = Cypress.$('body')

    // Visual cue to help debug
    const $supportNode = Cypress.$(`<h1>Support file hasn't been loaded 😿</h1>`)

    $body.append($supportNode)

    // @ts-ignore
    expect(window.supportFileWasLoaded).to.be.true
    $supportNode.text('Support file was loaded! ⚡️')
  })
})
