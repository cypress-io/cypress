import { parse } from '@babel/parser'
import { expect } from 'chai'
import dedent from 'dedent'
import fs from 'fs-extra'
import path from 'path'
import { DataContext } from '../../../src'
import {
  Action,
  codeGenerator,
  CodeGenResult,
  CodeGenResults,
  hasNonExampleSpec,
  getExampleSpecPaths,
} from '../../../src/codegen/code-generator'
import { SpecOptions } from '../../../src/codegen/spec-options'
import templates from '../../../src/codegen/templates'
import { createTestDataContext } from '../helper'
import { CT_FRAMEWORKS } from '@packages/scaffold-config'
import { defaultSpecPattern } from '@packages/config'

const tmpPath = path.join(__dirname, 'tmp/test-code-gen')

const babelParse = (content: string) => parse(content, { sourceType: 'module', plugins: ['jsx', 'typescript'] })

describe('code-generator', () => {
  let ctx: DataContext

  beforeEach(async () => {
    await fs.remove(tmpPath)
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
            describe('template spec', () => {
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
              // see: https://on.cypress.io/mounting-vue
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

  it('should generate from React component template', async () => {
    const fileName = 'counter.cy.tsx'
    const target = path.join(tmpPath, 'component')
    const fileAbsolute = path.join(target, fileName)
    const action: Action = {
      templateDir: templates.reactComponent,
      target,
    }
    const codeGenArgs = {
      componentName: 'Counter',
      componentPath: 'path/to/component',
      fileName,
      isDefault: false,
    }

    const codeGenResults = await codeGenerator(action, codeGenArgs)

    const expected: CodeGenResults = {
      files: [
        {
          type: 'text',
          status: 'add',
          file: fileAbsolute,
          content: dedent`
          import React from 'react'
          import { ${codeGenArgs.componentName} } from '${codeGenArgs.componentPath}'

          describe('<${codeGenArgs.componentName} />', () => {
            it('renders', () => {
              // see: https://on.cypress.io/mounting-react
              cy.mount(<${codeGenArgs.componentName} />)
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

  it('should generate from React component template with default export', async () => {
    const fileName = 'counter.cy.tsx'
    const target = path.join(tmpPath, 'component')
    const fileAbsolute = path.join(target, fileName)
    const action: Action = {
      templateDir: templates.reactComponent,
      target,
    }
    const codeGenArgs = {
      componentName: 'Counter',
      componentPath: 'path/to/component',
      fileName,
      isDefault: true,
    }

    const codeGenResults = await codeGenerator(action, codeGenArgs)

    const expected: CodeGenResults = {
      files: [
        {
          type: 'text',
          status: 'add',
          file: fileAbsolute,
          content: dedent`
          import React from 'react'
          import ${codeGenArgs.componentName} from '${codeGenArgs.componentPath}'

          describe('<${codeGenArgs.componentName} />', () => {
            it('renders', () => {
              // see: https://on.cypress.io/mounting-react
              cy.mount(<${codeGenArgs.componentName} />)
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

  it('should generate from e2eExamples', async () => {
    const target = path.join(tmpPath, 'scaffold-integration')
    const action: Action = {
      templateDir: templates.e2eExamples,
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
      framework: CT_FRAMEWORKS[1],
      isDefaultSpecPattern: true,
      specPattern: [defaultSpecPattern.component],
    })

    let codeGenOptions = await newSpecCodeGenOptions.getCodeGenOptions()

    const codeGenResult = await codeGenerator(action, codeGenOptions)

    expect(() => babelParse(codeGenResult.files[0].content)).not.throw()
  })

  context('nonExampleSpecfile', () => {
    it('should return true after adding new spec file', async () => {
      const target = path.join(tmpPath, 'spec-check')

      const checkBeforeScaffolding = await hasNonExampleSpec(templates.e2eExamples, [])

      expect(checkBeforeScaffolding, 'expected having no spec files to show no non-example specs').to.be.false

      const scaffoldExamplesAction: Action = {
        templateDir: templates.e2eExamples,
        target,
      }

      const addTemplatesAsSpecs = (results: CodeGenResults) => {
        return results.files.map((file) => {
          return file.file.substring(target.length + 1)
        })
      }

      const scaffoldResults = await codeGenerator(scaffoldExamplesAction, {})

      expect(scaffoldResults.files.length, 'expected scaffold files to be created').gt(0)

      const specs = addTemplatesAsSpecs(scaffoldResults)

      const checkAfterScaffolding = await hasNonExampleSpec(templates.e2eExamples, specs)

      expect(checkAfterScaffolding, 'expected only having template files to show no non-example specs').to.be.false

      const fileName = 'my-test-file.js'
      const scaffoldTemplateAction: Action = {
        templateDir: templates.e2e,
        target,
      }
      const codeGenArgs = { fileName }

      const generatedTest = await codeGenerator(scaffoldTemplateAction, codeGenArgs)

      const specsWithGenerated = [...specs, ...addTemplatesAsSpecs(generatedTest)]

      const checkAfterTemplate = await hasNonExampleSpec(templates.e2eExamples, specsWithGenerated)

      expect(checkAfterTemplate, 'expected check after adding a new spec to indicate there are now non-example specs').to.be.true
    })

    it('should error if template dir does not exist', async () => {
      const singleSpec = ['sample.spec.ts']

      expect(async () => await hasNonExampleSpec('', singleSpec)).to.throw
    })
  })

  context('hasNonExampleSpec', async () => {
    it('should error if template dir does not exist', () => {
      expect(async () => await getExampleSpecPaths('')).to.throw
    })

    it('should return relative paths to example specs', async () => {
      const results = await getExampleSpecPaths(templates.e2eExamples)

      expect(results.length).to.be.greaterThan(0)

      results.forEach((specPath) => {
        const fullPathToSpec = path.join(templates.e2eExamples, specPath)

        expect(fs.pathExistsSync(fullPathToSpec), `expected to find file at ${fullPathToSpec}`).to.be.true
      })
    })
  })
})
