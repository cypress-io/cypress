import { expect } from 'chai'
import chalk from 'chalk'

import { details, errTemplate, guard } from '../../src/errTemplate'
import { stripIndent } from '../../src/stripIndent'

describe('errTemplate', () => {
  it('returns an object w/ basic props & forBrowser', () => {
    const obj = errTemplate`Hello world`

    expect(obj).to.include({ message: 'Hello world' })
    expect(obj.forBrowser()).to.include({ message: 'Hello world' })
  })

  it('colors blue by default for the console, backticks passed arguments for the browser,', () => {
    const obj = errTemplate`Hello world ${'special'}`

    expect(obj).to.include({ message: `Hello world ${chalk.blue('special')}` })
    expect(obj.forBrowser()).to.include({ message: 'Hello world `special`' })
  })

  it('uses guard to guard passed values', () => {
    const obj = errTemplate`Hello world ${guard('special')}`

    expect(obj).to.include({ message: `Hello world special` })
    expect(obj.forBrowser()).to.include({ message: `Hello world special` })
  })

  it('provides as details for toErrorProps', () => {
    const errStack = new Error().stack ?? ''
    const obj = errTemplate`
      This was an error
      
      ${details(errStack)}
    `

    expect(obj).to.include({ message: `This was an error`, details: errStack })
  })

  it('will stringify non scalar values', () => {
    const someObj = { a: 1, b: 2, c: 3 }
    const obj = errTemplate`
      This was returned from the app:
      
      ${someObj}
    `

    expect(obj.forBrowser()).to.include({
      message: stripIndent`
        This was returned from the app:

        \`\`\`
        ${JSON.stringify(someObj, null, 2)}
        \`\`\``,
    })

    expect(obj).to.include({
      message: stripIndent`
        This was returned from the app:

        ${JSON.stringify(someObj, null, 2)}
      `,
    })
  })

  it('will stringify details values', () => {
    const someObj = { a: 1, b: 2, c: 3 }
    const obj = errTemplate`
      This was returned from the app:
      
      ${details(someObj)}
    `

    expect(obj.forBrowser()).to.include({ message: `This was returned from the app:` })
    expect(obj).to.include({ message: `This was returned from the app:`, details: JSON.stringify(someObj, null, 2) })
  })

  it('uses details to set originalError, for toErrorProps, highlight stack for console', () => {
    const specFile = 'specFile.js'
    const err = new Error()
    const obj = errTemplate`
      This was an error in ${specFile}
      
      ${details(err)}
    `

    expect(obj.forBrowser()).to.include({ message: `This was an error in \`specFile.js\`` })
    expect(obj).to.include({ message: `This was an error in ${chalk.blue(specFile)}`, details: err.stack })
  })

  it('throws if multiple details are used in the same template', () => {
    expect(() => {
      errTemplate`
        Hello world 
        
        ${details(new Error())}

        ${details(new Error())}
      `
    }).to.throw(/Cannot use details\(\) multiple times in the same errTemplate/)
  })
})
