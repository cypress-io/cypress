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
      const specialMessage = 'expected **__*abcdef*__** not to match **/__.*abcde.*__/**'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('expected <strong>__*abcdef*__</strong> not to match <strong>/__.*abcde.*__/</strong>')
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

    it('bolds asterisks with complex assertions', () => {
      const specialMessage = 'expected **span** to have CSS property **background-color** with the value **rgb(0, 0, 0)**, but the value was **rgba(0, 0, 0, 0)**'
      const result = formattedMessage(specialMessage)

      expect(result).to.equal('expected <strong>span</strong> to have CSS property <strong>background-color</strong> with the value <strong>rgb(0, 0, 0)</strong>, but the value was <strong>rgba(0, 0, 0, 0)</strong>')
    })

    it('bolds asterisks with "but" without comma', () => {
      const specialMessage = 'expected **foo** to have length above **1** but got **0**'
      const result = formattedMessage(specialMessage)

      expect(result).to.equal('expected <strong>foo</strong> to have length above <strong>1</strong> but got <strong>0</strong>')
    })

    it('bolds asterisks with simple assertions', () => {
      const specialMessage = 'expected **dom** to be visible'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('expected <strong>dom</strong> to be visible')
    })

    it('bolds assertions and displays html correctly', () => {
      // expected <button#increment> to be enabled
      const specialMessage = 'expected **<button#increment>** to be enabled'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('expected <strong>&lt;button#increment&gt;</strong> to be enabled')
    })

    it('renders the custom message properly with the assertion message', () => {
      const specialMessage = 'My Custom Message: expected **abcdef** to equal **abcdef**'
      const result = formattedMessage(specialMessage, 'assert')

      expect(result).to.equal('My Custom Message: expected <strong>abcdef</strong> to equal <strong>abcdef</strong>')
    })
  })

  describe('when command that accepts url', () => {
    it('cy.visit does not do markdown formatting', () => {
      const specialMessage = 'http://www.test.com/__Path__99~~path~~'
      const result = formattedMessage(specialMessage, 'visit')

      expect(result).to.equal('http://www.test.com/__Path__99~~path~~')
    })

    it('cy.request does not do markdown formatting', () => {
      const specialMessage = 'http://www.test.com/__Path__99~~path~~'
      const result = formattedMessage(specialMessage, 'request')

      expect(result).to.equal('http://www.test.com/__Path__99~~path~~')
    })

    it('cy.origin does not do markdown formatting', () => {
      const specialMessage = 'http://www.test.com/__Path__99~~path~~'
      const result = formattedMessage(specialMessage, 'origin')

      expect(result).to.equal('http://www.test.com/__Path__99~~path~~')
    })
  })

  describe('when not an assertion', () => {
    it('displays special characters as markdown when not assertion', () => {
      const specialMessage = 'message\n here `code block` with *formatting*'
      const result = formattedMessage(specialMessage)

      expect(result).to.equal(`message\nhere <code>code block</code> with <em>formatting</em>`)
    })
  })
})
