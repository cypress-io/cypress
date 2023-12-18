import { formattedMessage } from '../../../src/commands/command'

describe('formattedMessage', () => {
  it('returns empty string when message is falsy', () => {
    const result = formattedMessage('')

    expect(result).to.equal('')
  })

  it('maintains special characters when using "to match"', () => {
    const specialMessage = 'expected **__*abcdef*__** to match /__.*abcdef.*__/'
    const result = formattedMessage(specialMessage)

    // Underscores should be displayed as is (issue #28100)
    expect(result).to.equal('expected <strong>__<em>abcdef</em>__</strong> to match <strong>/__.*abcdef.*__/</strong>')
  })

  it('maintains special characters when using "to contain"', () => {
    const specialMessage = 'expected ***abcdef*** to equal ***abcdef***'
    const result = formattedMessage(specialMessage)

    expect(result).to.equal('expected <em><strong>abcdef</strong></em> to equal <strong>***abcdef***</strong>')
  })

  it('does NOT maintain special characters when "to equal" or "to match" are not in assertion', () => {
    const specialMessage = 'expected ***abcdef*** to contain ***abcdef***'
    const result = formattedMessage(specialMessage)

    expect(result).to.equal('expected <em><strong>abcdef</strong></em> to contain <em><strong>abcdef</strong></em>')
  })

  it('maintains initial spaces on new lines', () => {
    const specialMessage = 'hello\n world `code block`'
    const result = formattedMessage(specialMessage)

    expect(result).to.equal('hello<br>\n world <code>code block</code>')
  })
})
