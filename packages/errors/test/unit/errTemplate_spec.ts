import { expect } from 'chai'
import chalk from 'chalk'
import { errTemplate, fmt, theme } from '../../src/errTemplate'
import { stripIndent } from '../../src/stripIndent'

describe('errTemplate', () => {
  it('returns an object w/ basic props & forBrowser', () => {
    const obj = errTemplate`Hello world`

    expect(obj).to.include({ message: 'Hello world' })
    expect(obj).to.include({ messageMarkdown: 'Hello world' })
  })

  it('colors yellow by default for the console, backticks passed arguments for the browser,', () => {
    const obj = errTemplate`Hello world ${fmt.highlight('special')}`

    expect(obj).to.include({ message: `Hello world ${chalk.yellow('special')}` })
    expect(obj).to.include({ messageMarkdown: 'Hello world `special`' })
  })

  it('uses fmt.off to guard passed values', () => {
    const obj = errTemplate`Hello world ${fmt.off('special')}`

    expect(obj).to.include({ message: `Hello world special` })
    expect(obj).to.include({ messageMarkdown: `Hello world special` })
  })

  it('will stringify non scalar values', () => {
    const someObj = { a: 1, b: 2, c: 3 }
    const obj = errTemplate`
      This was returned from the app:

      ${fmt.highlightTertiary(someObj)}`

    expect(obj).to.include({
      messageMarkdown: stripIndent`
        This was returned from the app:

        \`\`\`
        ${JSON.stringify(someObj, null, 2)}
        \`\`\``,
    })

    expect(obj).to.include({
      message: stripIndent`
        This was returned from the app:

        ${theme.blue(JSON.stringify(someObj, null, 2))}`,
    })
  })

  it('sets originalError, for toErrorProps, highlight stack for console', () => {
    const specFile = 'specFile.js'
    const err = new Error()
    const obj = errTemplate`
      This was an error in ${fmt.highlight(specFile)}

      ${fmt.stackTrace(err)}`

    expect(obj).to.include({ messageMarkdown: `This was an error in \`specFile.js\`` })
    expect(obj).to.include({
      message: `This was an error in ${chalk.yellow(specFile)}`,
      details: err.stack ?? '',
    })
  })

  it('throws if multiple details are used in the same template', () => {
    expect(() => {
      errTemplate`
        Hello world

        ${fmt.stackTrace(new Error())}

        ${fmt.stackTrace(new Error())}
      `
    }).to.throw(/Cannot use fmt.stackTrace\(\) multiple times in the same errTemplate/)
  })
})
