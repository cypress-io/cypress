import { isBoolean } from 'lodash'

describe('Support files', () => {
  it('successfully imports isBoolean from lodash', () => {
    expect(isBoolean(true)).to.be.true
  })

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
