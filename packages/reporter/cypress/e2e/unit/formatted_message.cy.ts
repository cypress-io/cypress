import { formattedMessage } from '../../../src/commands/command'

describe('formattedMessage', () => {
  it('returns empty string when message is falsy', () => {
    const result = formattedMessage('')

    expect(result).to.equal('')
  })

  describe('when assertion', () => {
    it('does not display extraneous "*" for to equal assertions', () => {
      const specialMessage = 'expected **abcdef** to equal **abcdef**'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('expected <strong>abcdef</strong> to equal <strong>abcdef</strong>')
    })

    it('does not display extraneous "*" for to not equal assertions', () => {
      const specialMessage = 'expected **abcdef** to not equal **abcde**'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('expected <strong>abcdef</strong> to not equal <strong>abcde</strong>')
    })

    it('maintains special characters when using "to match"', () => {
      const specialMessage = 'expected **__*abcdef*__** to match **/__.*abcdef.*__/**'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('expected <strong>__*abcdef*__</strong> to match <strong>/__.*abcdef.*__/</strong>')
    })

    it('maintains special characters when using "to not match"', () => {
      const specialMessage = 'expected **__*abcdef*__** to not match **/__.*abcde.*__/**'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('expected <strong>__*abcdef*__</strong> to not match <strong>/__.*abcde.*__/</strong>')
    })

    it('maintains special characters when using "to equal"', () => {
      const specialMessage = 'expected *****abcdef***** to equal *****abcdef*****'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('expected <strong>***abcdef***</strong> to equal <strong>***abcdef***</strong>')
    })

    it('maintains special characters when using "to not equal"', () => {
      const specialMessage = 'expected *****abcdef***** to not equal *****abcde*****'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('expected <strong>***abcdef***</strong> to not equal <strong>***abcde***</strong>')
    })

    it('maintains initial spaces on new lines', () => {
      const specialMessage = 'expected **hello\n world `code block`** to equal **hello\n world `code block`**'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('expected <strong>hello\n world `code block`</strong> to equal <strong>hello\n world `code block`</strong>')
    })

    it('bolds asterisks using "to contain"', () => {
      const specialMessage = 'expected **glob*glob** to contain *****'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('expected <strong>glob*glob</strong> to contain <strong>*</strong>')
    })
  })

  describe('when not an assertion', () => {
    it('displays special characters as markdown when not assertion', () => {
      const specialMessage = 'expected **__*abcdef*__** to contain **/__.*abcdef.*__/**'
      const result = formattedMessage(specialMessage)

      expect(result).to.equal('expected <strong><strong><em>abcdef</em></strong></strong> to contain <strong>/<strong>.<em>abcdef.</em></strong>/</strong>')
    })
  })
})
