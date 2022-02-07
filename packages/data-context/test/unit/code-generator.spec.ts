import path from 'path'
import {
  codeGenerator,
  Action,
  CodeGenResults,
  CodeGenResult,
} from '../../src/codegen/code-generator'
import templates from '../../src/codegen/templates'
import { expect } from 'chai'
import dedent from 'dedent'
import fs from 'fs-extra'
import { parse } from '@babel/parser'

const tmpPath = path.join(__dirname, 'tmp/test-code-gen')

describe('code-generator', () => {
  before(async () => {
    await fs.remove(tmpPath)
  })

  it('should generate files with ejs and preserve file structure', async () => {
    const target = path.join(tmpPath, 'test')
    const indexFileName = 'index.js'
    const templateDir = path.join(__dirname, 'template-test')

    const action: Action = {
      templateDir,
      target,
    }
    const codeGenArgs = { indexFileName, message: 'Hello World' }

    const codeGenResults = await codeGenerator(action, codeGenArgs)
    const expected: CodeGenResults = {
      files: [
        {
          type: 'binary',
          status: 'add',
          file: path.join(target, 'binary.jpg'),
          // Don't care about content
          content: (
            await fs.readFile(path.join(templateDir, 'binary.jpg'))
          ).toString(),
        },
        {
          type: 'text',
          status: 'add',
          file: path.join(target, indexFileName),
          content: 'console.log("Hello World")',
        },
        {
          type: 'text',
          status: 'add',
          file: path.join(target, 'nested/Hello.md'),
          content: '# Hello World',
        },
      ],
      failed: [],
    }

    expect(codeGenResults).deep.eq(expected)

    const skippedExpected = {
      ...expected,
      files: expected.files.map((file) => ({ ...file, status: 'skipped' })),
    }
    const skippedCodeGenResults = await codeGenerator(action, codeGenArgs)

    expect(skippedCodeGenResults).deep.eq(skippedExpected)

    const getMTimes = (files: Array<CodeGenResult>) => {
      return Promise.all(
        files.map(({ file }) => fs.stat(file).then((stat) => stat.mtimeMs)),
      )
    }
    const mTimesBefore = await getMTimes(codeGenResults.files)
    let mTimesAfter = await getMTimes(skippedCodeGenResults.files)

    expect(mTimesBefore).deep.eq(mTimesAfter)

    const overwriteAction: Action = { ...action, overwrite: true }
    const overwriteExpected: CodeGenResults = {
      ...expected,
      files: expected.files.map((file) => ({ ...file, status: 'overwrite' })),
    }
    const overwriteCodeGenResults = await codeGenerator(
      overwriteAction,
      codeGenArgs,
    )

    expect(overwriteCodeGenResults).deep.eq(overwriteExpected)

    mTimesAfter = await getMTimes(overwriteCodeGenResults.files)

    expect(mTimesBefore).not.deep.eq(mTimesAfter)
    mTimesAfter.forEach((time, i) => expect(time > mTimesBefore[i]))
  })

  it('should generate from integration template', async () => {
    const fileName = 'my-integration-file.js'
    const target = path.join(tmpPath, 'integration')
    const fileAbsolute = path.join(target, fileName)
    const action: Action = {
      templateDir: templates.e2e,
      target,
    }
    const codeGenArgs = { fileName }

    const codeGenResults = await codeGenerator(action, codeGenArgs)
    const expected: CodeGenResults = {
      files: [
        {
          type: 'text',
          status: 'add',
          file: fileAbsolute,
          content: `${dedent`
            describe('my-integration-file.js', () => {
              it('should visit', () => {
                cy.visit('/')
              })
            })` }\n`,
        },
      ],
      failed: [],
    }

    expect(codeGenResults).deep.eq(expected)

    const fileContent = (await fs.readFile(fileAbsolute)).toString()

    expect(fileContent).eq(expected.files[0].content)

    expect(() => parse(fileContent)).not.throw()
  })

  it('should generate from component template', async () => {
    const fileName = 'Button.tsx'
    const target = path.join(tmpPath, 'component')
    const fileAbsolute = path.join(target, fileName)
    const action: Action = {
      templateDir: templates.component,
      target,
    }
    const codeGenArgs = {
      imports: [
        'import { mount } from "@cypress/react"',
        'import Button from "./Button"',
      ],
      componentName: 'Button',
      docsLink: '// see: https://reactjs.org/docs/test-utils.html',
      mount: 'mount(<Button />)',
      fileName,
    }

    const codeGenResults = await codeGenerator(action, codeGenArgs)
    const expected: CodeGenResults = {
      files: [
        {
          type: 'text',
          status: 'add',
          file: fileAbsolute,
          content: dedent`
            import { mount } from "@cypress/react"
            import Button from "./Button"
            
            describe('<Button />', () => {
              it('renders', () => {
                // see: https://reactjs.org/docs/test-utils.html
                mount(<Button />)
              })
            })`,
        },
      ],
      failed: [],
    }

    expect(codeGenResults).deep.eq(expected)

    const fileContent = (await fs.readFile(fileAbsolute)).toString()

    expect(fileContent).eq(expected.files[0].content)

    expect(() => {
      return parse(fileContent, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      })
    }).not.throw()
  })

  it('should generate from story template', async () => {
    const fileName = 'Button.stories.jsx'
    const target = path.join(tmpPath, 'story')
    const fileAbsolute = path.join(target, fileName)
    const action: Action = {
      templateDir: templates.story,
      target,
    }
    const codeGenArgs = {
      imports: [
        'import React from "react"',
        'import { mount } from "@cypress/react"',
        'import { composeStories } from "@storybook/testing-react"',
        `import * as stories from "./Button.stories"`,
      ],
      stories: [{ component: 'Primary', mount: 'mount(<Primary />)' }],
      title: 'ButtonStories',
      fileName,
    }

    const codeGenResults = await codeGenerator(action, codeGenArgs)
    const expected: CodeGenResults = {
      files: [
        {
          type: 'text',
          status: 'add',
          file: fileAbsolute,
          content: dedent`
            import React from "react"
            import { mount } from "@cypress/react"
            import { composeStories } from "@storybook/testing-react"
            import * as stories from "./Button.stories"
            
            const composedStories = composeStories(stories)
            
            describe('ButtonStories', () => {
              it('should render Primary', () => {
                const { Primary } = composedStories
                mount(<Primary />)
              })
            })`,
        },
      ],
      failed: [],
    }

    expect(codeGenResults).deep.eq(expected)

    const fileContent = (await fs.readFile(fileAbsolute)).toString()

    expect(fileContent).eq(expected.files[0].content)

    expect(() => {
      return parse(fileContent, { sourceType: 'module', plugins: ['jsx'] })
    }).not.throw()
  })

  it('should generate from scaffoldIntegration', async () => {
    const target = path.join(tmpPath, 'scaffold-integration')
    const action: Action = {
      templateDir: templates.scaffoldIntegration,
      target,
    }

    // We don't control the scaffold-integration template. It comes from
    // https://github.com/cypress-io/cypress-example-kitchensink
    const codeGenResult = await codeGenerator(action, {})

    expect(codeGenResult.files.length).gt(0)
    for (const res of codeGenResult.files) {
      expect(async () => await fs.access(res.file, fs.constants.F_OK)).not.throw()
      const shouldParse = ['js', 'ts'].some((ext) => res.file.endsWith(ext))

      if (shouldParse) {
        expect(() => {
          return parse(res.content, {
            sourceType: 'module',
          })
        }).not.throw()
      }
    }
  })
})
