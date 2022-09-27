import { parse } from '@babel/parser'
import { expect } from 'chai'
import dedent from 'dedent'
import fs from 'fs-extra'
import path from 'path'
import { DataContext } from '../../../src'
import {
  Action, codeGenerator, CodeGenResult, CodeGenResults,
} from '../../../src/codegen/code-generator'
import { SpecOptions } from '../../../src/codegen/spec-options'
import templates from '../../../src/codegen/templates'
import { createTestDataContext } from '../helper'
import { WIZARD_FRAMEWORKS } from '@packages/scaffold-config'
import { defaultSpecPattern } from '@packages/config'

const tmpPath = path.join(__dirname, 'tmp/test-code-gen')

const babelParse = (content: string) => parse(content, { sourceType: 'module', plugins: ['jsx', 'typescript'] })

describe('code-generator', () => {
  before(async () => {
    await fs.remove(tmpPath)
  })

  let ctx: DataContext

  beforeEach(async () => {
    ctx = createTestDataContext()

    ctx.update((s) => {
      s.currentProject = tmpPath
    })
  })

  it('should generate files with ejs and preserve file structure', async () => {
    const target = path.join(tmpPath, 'test')
    const indexFileName = 'index.js'
    const templateDir = path.join(__dirname, 'files', 'template-test')

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
            describe('empty spec', () => {
              it('passes', () => {
                cy.visit('https://example.cypress.io')
              })
            })` }`,
        },
      ],
      failed: [],
    }

    expect(codeGenResults).deep.eq(expected)

    const fileContent = (await fs.readFile(fileAbsolute)).toString()

    expect(fileContent).eq(expected.files[0].content)

    expect(() => babelParse(fileContent)).not.throw()
  })

  it('should generate from empty component template', async () => {
    const fileName = 'Button.tsx'
    const target = path.join(tmpPath, 'component')
    const fileAbsolute = path.join(target, fileName)
    const action: Action = {
      templateDir: templates.componentEmpty,
      target,
    }
    const codeGenArgs = {
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
            describe('Button.tsx', () => {
              it('playground', () => {
                // cy.mount()
              })
            })`,
        },
      ],
      failed: [],
    }

    expect(codeGenResults).deep.eq(expected)

    const fileContent = (await fs.readFile(fileAbsolute)).toString()

    expect(fileContent).eq(expected.files[0].content)

    expect(() => babelParse(fileContent)).not.throw()
  })

  it('should generate from Vue component template', async () => {
    const fileName = 'MyComponent.vue'
    const target = path.join(tmpPath, 'component')
    const fileAbsolute = path.join(target, fileName)
    const action: Action = {
      templateDir: templates.vueComponent,
      target,
    }
    const codeGenArgs = {
      componentName: 'MyComponent',
      componentPath: 'path/to/component',
      fileName,
    }

    const codeGenResults = await codeGenerator(action, codeGenArgs)
    const expected: CodeGenResults = {
      files: [
        {
          type: 'text',
          status: 'add',
          file: fileAbsolute,
          content: dedent`import ${codeGenArgs.componentName} from '${codeGenArgs.componentPath}'

          describe('<${codeGenArgs.componentName} />', () => {
            it('renders', () => {
              // see: https://test-utils.vuejs.org/guide/
              cy.mount(${codeGenArgs.componentName})
            })
          })`,
        },
      ],
      failed: [],
    }

    expect(codeGenResults).deep.eq(expected)

    const fileContent = (await fs.readFile(fileAbsolute)).toString()

    expect(fileContent).eq(expected.files[0].content)

    expect(() => babelParse(fileContent)).not.throw()
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
        expect(() => babelParse(res.content)).not.throw()
      }
    }
  })

  it('should generate empty test from react component', async () => {
    const target = path.join(tmpPath, 'react-component')
    const action: Action = {
      templateDir: templates.componentEmpty,
      target,
    }

    const newSpecCodeGenOptions = new SpecOptions({
      currentProject: 'path/to/myProject',
      codeGenPath: path.join(__dirname, 'files', 'react', 'Button.jsx'),
      codeGenType: 'component',
      framework: WIZARD_FRAMEWORKS[1],
      isDefaultSpecPattern: true,
      specPattern: [defaultSpecPattern.component],
    })

    let codeGenOptions = await newSpecCodeGenOptions.getCodeGenOptions()

    const codeGenResult = await codeGenerator(action, codeGenOptions)

    expect(() => babelParse(codeGenResult.files[0].content)).not.throw()
  })
})
