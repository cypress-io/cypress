import { defaultSpecPattern } from '@packages/config'
import { CT_FRAMEWORKS } from '@packages/scaffold-config'
import { expect } from 'chai'
import fs from 'fs-extra'
import path from 'path'
import sinon from 'sinon'
import { DataContext } from '../../../src'
import { SpecOptions, expectedSpecExtensions } from '../../../src/codegen/spec-options'
import { createTestDataContext } from '../helper'

const tmpPath = path.join(__dirname, 'tmp/test-code-gen')

describe('spec-options', () => {
  let ctx: DataContext

  beforeEach(async () => {
    await fs.remove(tmpPath)

    ctx = createTestDataContext()

    ctx.update((s) => {
      s.currentProject = tmpPath
    })
  })

  describe('getCodeGenOptions', () => {
    it('uses expected set of spec extensions', () => {
      expect(expectedSpecExtensions).to.deep.eq(['.cy', '.spec', '.test', '-spec', '-test', '_spec'])
    })

    context('unique file names', () => {
      for (const specExtension of expectedSpecExtensions) {
        it(`generates options for names with extension ${specExtension}`, async () => {
          const testSpecOptions = new SpecOptions({
            currentProject: 'path/to/myProject',
            codeGenPath: `${tmpPath}/TestName${specExtension}.js`,
            codeGenType: 'e2e',
            isDefaultSpecPattern: true,
            specPattern: [defaultSpecPattern.e2e],
          })

          const result = await testSpecOptions.getCodeGenOptions()

          expect(result.codeGenType).to.eq('e2e')
          expect(result.fileName).to.eq(`TestName${specExtension}.js`)
        })
      }

      it('generates options for file name without spec extension', async () => {
        const testSpecOptions = new SpecOptions({
          currentProject: 'path/to/myProject',
          codeGenPath: `${tmpPath}/TestName.js`,
          codeGenType: 'e2e',
          isDefaultSpecPattern: true,
          specPattern: [defaultSpecPattern.e2e],
        })

        const result = await testSpecOptions.getCodeGenOptions()

        expect(result.codeGenType).to.eq('e2e')
        expect(result.fileName).to.eq(`TestName.js`)
      })

      it('generates options for file name with multiple extensions', async () => {
        const testSpecOptions = new SpecOptions({
          currentProject: 'path/to/myProject',
          codeGenPath: `${tmpPath}/TestName.foo.bar.js`,
          codeGenType: 'e2e',
          isDefaultSpecPattern: true,
          specPattern: [defaultSpecPattern.e2e],
        })

        const result = await testSpecOptions.getCodeGenOptions()

        expect(result.codeGenType).to.eq('e2e')
        expect(result.fileName).to.eq(`TestName.foo.bar.js`)
      })
    })

    context('create from component', () => {
      afterEach(function () {
        sinon.restore()
      })

      context('Vue', () => {
        it('generates options for generating a Vue component spec', async () => {
          const testSpecOptions = new SpecOptions({
            currentProject: 'path/to/myProject',
            codeGenPath: `${tmpPath}/MyComponent.vue`,
            codeGenType: 'component',
            isDefaultSpecPattern: true,
            framework: CT_FRAMEWORKS[1],
            specPattern: [defaultSpecPattern.component],
          })

          const result = await testSpecOptions.getCodeGenOptions()

          expect(result.codeGenType).to.eq('component')
          expect(result.templateKey).to.eq('vueComponent')
          expect(result.fileName).to.eq('MyComponent.cy.js')
        })

        it('creates copy file if spec already exists', async () => {
          sinon.stub(fs, 'access').onFirstCall().resolves().onSecondCall().rejects()

          const testSpecOptions = new SpecOptions({
            currentProject: 'path/to/myProject',
            codeGenPath: `${tmpPath}/MyComponent.vue`,
            codeGenType: 'component',
            isDefaultSpecPattern: true,
            framework: CT_FRAMEWORKS[1],
            specPattern: [defaultSpecPattern.component],
          })

          const result = await testSpecOptions.getCodeGenOptions()

          expect(result.codeGenType).to.eq('component')
          expect(result.templateKey).to.eq('vueComponent')
          expect(result.fileName).to.eq('MyComponent-copy-1.cy.js')
        })
      })

      context('React', () => {
        it('generates options for generating a React component spec', async () => {
          const testSpecOptions = new SpecOptions({
            currentProject: 'path/to/myProject',
            codeGenPath: `${tmpPath}/Counter.tsx`,
            codeGenType: 'component',
            isDefaultSpecPattern: true,
            framework: CT_FRAMEWORKS[2],
            specPattern: [defaultSpecPattern.component],
            componentName: 'Counter',
            isDefault: true,
          })

          const result = await testSpecOptions.getCodeGenOptions()

          expect(result.codeGenType).to.eq('component')
          expect(result.templateKey).to.eq('reactComponent')
          expect(result.fileName).to.eq('Counter.cy.tsx')
        })

        it('creates a spec file with file and component names combined if they are different', async () => {
          const testSpecOptions = new SpecOptions({
            currentProject: 'path/to/myProject',
            codeGenPath: `${tmpPath}/Counter.tsx`,
            codeGenType: 'component',
            isDefaultSpecPattern: true,
            framework: CT_FRAMEWORKS[2],
            specPattern: [defaultSpecPattern.component],
            componentName: 'View',
          })

          const result = await testSpecOptions.getCodeGenOptions()

          expect(result.codeGenType).to.eq('component')
          expect(result.templateKey).to.eq('reactComponent')
          expect(result.fileName).to.eq('CounterView.cy.tsx')
        })

        it('creates copy file if spec already exists', async () => {
          sinon.stub(fs, 'access').onFirstCall().resolves().onSecondCall().rejects()

          const testSpecOptions = new SpecOptions({
            currentProject: 'path/to/myProject',
            codeGenPath: `${tmpPath}/Counter.tsx`,
            codeGenType: 'component',
            isDefaultSpecPattern: true,
            framework: CT_FRAMEWORKS[2],
            specPattern: [defaultSpecPattern.component],
            componentName: 'View',
          })

          const result = await testSpecOptions.getCodeGenOptions()

          expect(result.codeGenType).to.eq('component')
          expect(result.templateKey).to.eq('reactComponent')
          expect(result.fileName).to.eq('CounterView-copy-1.cy.tsx')
        })
      })

      context('custom spec pattern', () => {
        [{ testName: 'src/specs-folder/*.cy.{js,jsx}', componentPath: 'ComponentName.vue', specs: [], pattern: 'src/specs-folder/*.cy.{js,jsx}', expectedPath: 'src/specs-folder/ComponentName.cy.js' },
          { testName: 'src/**/*.{spec,cy}.{js,jsx,ts,tsx}', componentPath: 'MyComponent.vue', specs: [], pattern: 'src/**/*.{spec,cy}.{js,jsx,ts,tsx}', expectedPath: 'src/MyComponent.spec.ts', isTypescriptComponent: true },
          { testName: '**/*.test.js', componentPath: 'src/Foo.vue', specs: [], pattern: '**/*.test.js', expectedPath: 'cypress/Foo.test.js' },
          { testName: 'src/**/*.js', componentPath: 'src/Foo.vue', specs: [], pattern: 'src/**/*.js', expectedPath: 'src/Foo.js' },
          { testName: '**/*.js no specs', componentPath: 'src/Foo.vue', specs: [], pattern: '**/*.js', expectedPath: 'cypress/Foo.js' },
          { testName: '**/*.js existing spec', componentPath: 'src/Foo.vue',
            specs: [{ specType: 'component' as Cypress.CypressSpecType, name: 'src/Bar.cy.js', baseName: 'Bar.cy.js', fileName: 'Bar', relative: 'src/Bar.cy.js', absolute: `${tmpPath}/src/Bar.cy.js`, fileExtension: '.js', specFileExtension: '.cy.js' }],
            pattern: '**/*.js', expectedPath: 'src/Foo.js' },
          { testName: '**/*.js spec already exists', componentPath: 'src/Foo.vue',
            specs: [{ specType: 'component' as Cypress.CypressSpecType, name: 'src/Foo.cy.js', baseName: 'Foo.cy.js', fileName: 'Foo', relative: 'src/Foo.cy.js', absolute: `${tmpPath}/src/Foo.cy.js`, fileExtension: '.js', specFileExtension: '.cy.js' }],
            pattern: '**/*.cy.js', expectedPath: 'src/Foo-copy-1.cy.js', makeCopy: true }]
        .forEach(({ testName, componentPath, specs, pattern, expectedPath, makeCopy, isTypescriptComponent }) => {
          it(testName, async () => {
            // This stub simulates the spec file already existing the first time we try, which should cause a copy to be created
            if (makeCopy) {
              sinon.stub(fs, 'access').onFirstCall().resolves().onSecondCall().rejects()
            }

            // This stub simulates that the component we are generating a spec from is using Typescript.
            if (isTypescriptComponent) {
              // @ts-ignore
              sinon.stub(fs, 'readFile').resolves('lang="ts"')
            }

            const currentProject = 'path/to/myProject'
            const specPattern = [pattern]

            const testSpecOptions = new SpecOptions({
              currentProject,
              codeGenPath: `${tmpPath}/${componentPath}`,
              codeGenType: 'component',
              isDefaultSpecPattern: false,
              framework: CT_FRAMEWORKS[1],
              specPattern,
              specs,
            })

            const result = await testSpecOptions.getCodeGenOptions()

            expect(result.codeGenType).to.eq('component')
            expect(result.templateKey).to.eq('vueComponent')
            expect(`${result.overrideCodeGenDir}/${result.fileName}`).to.eq(expectedPath)
          })
        })
      })
    })

    context('duplicate files names', () => {
      for (const specExtension of expectedSpecExtensions) {
        it(`generates options for file name with extension ${specExtension}`, async () => {
          const testSpecOptions = new SpecOptions({
            currentProject: 'path/to/myProject',
            codeGenPath: `${tmpPath}/TestName${specExtension}.js`,
            codeGenType: 'e2e',
            isDefaultSpecPattern: true,
            specPattern: [defaultSpecPattern.e2e],
          })

          await fs.outputFile(`${tmpPath}/TestName${specExtension}.js`, '// foo')

          let result = await testSpecOptions.getCodeGenOptions()

          expect(result.codeGenType).to.eq('e2e')
          expect(result.fileName).to.eq(`TestName-copy-1${specExtension}.js`)

          // Add copy to file system and generate options again, index should increment
          await fs.outputFile(`${tmpPath}/TestName-copy-1${specExtension}.js`, '// foo')

          result = await testSpecOptions.getCodeGenOptions()

          expect(result.codeGenType).to.eq('e2e')
          expect(result.fileName).to.eq(`TestName-copy-2${specExtension}.js`)
        })
      }

      it('generates options for file name without spec extension', async () => {
        const testSpecOptions = new SpecOptions({
          currentProject: 'path/to/myProject',
          codeGenPath: `${tmpPath}/TestName.js`,
          codeGenType: 'e2e',
          isDefaultSpecPattern: true,
          specPattern: [defaultSpecPattern.e2e],
        })

        await fs.outputFile(`${tmpPath}/TestName.js`, '// foo')

        let result = await testSpecOptions.getCodeGenOptions()

        expect(result.codeGenType).to.eq('e2e')
        expect(result.fileName).to.eq(`TestName-copy-1.js`)

        // Add copy to file system and generate options again, index should increment
        await fs.outputFile(`${tmpPath}/TestName-copy-1.js`, '// foo')

        result = await testSpecOptions.getCodeGenOptions()

        expect(result.codeGenType).to.eq('e2e')
        expect(result.fileName).to.eq(`TestName-copy-2.js`)
      })

      it('generates options for file name with multiple extensions', async () => {
        const testSpecOptions = new SpecOptions({
          currentProject: 'path/to/myProject',
          codeGenPath: `${tmpPath}/TestName.foo.bar.js`,
          codeGenType: 'e2e',
          isDefaultSpecPattern: true,
          specPattern: [defaultSpecPattern.e2e],
        })

        await fs.outputFile(`${tmpPath}/TestName.foo.bar.js`, '// foo')

        let result = await testSpecOptions.getCodeGenOptions()

        expect(result.codeGenType).to.eq('e2e')
        expect(result.fileName).to.eq(`TestName.foo.bar-copy-1.js`)

        // Add copy to file system and generate options again, index should increment
        await fs.outputFile(`${tmpPath}/TestName.foo.bar-copy-1.js`, '// foo')

        result = await testSpecOptions.getCodeGenOptions()

        expect(result.codeGenType).to.eq('e2e')
        expect(result.fileName).to.eq(`TestName.foo.bar-copy-2.js`)
      })

      context('file name contains special characters', async () => {
        [
          { condition: 'braces', fileName: '[...MyComponent].vue', expectedFileName: '[...MyComponent].cy.js', expectedComponentName: 'MyComponent' },
          { condition: 'hyphens', fileName: 'my-component.vue', expectedFileName: 'my-component.cy.js', expectedComponentName: 'MyComponent' },
          { condition: 'parentheses', fileName: 'My(Component).js', expectedFileName: 'My(Component).cy.js', expectedComponentName: 'MyComponent' },
          { condition: 'period-separated', fileName: 'my.component.js', expectedFileName: 'my.component.cy.js', expectedComponentName: 'MyComponent' },
          { condition: 'dollar', fileName: '$MyComponent.js', expectedFileName: '$MyComponent.cy.js', expectedComponentName: '$MyComponent' },
          { condition: 'underscores', fileName: 'My_Component.js', expectedFileName: 'My_Component.cy.js', expectedComponentName: 'My_Component' },
          { condition: 'mixed period- and hyphen-delimited', fileName: 'about-us.component.js', expectedFileName: 'about-us.component.cy.js', expectedComponentName: 'AboutUsComponent' },
        ].forEach(({ condition, fileName, expectedFileName, expectedComponentName }) => {
          it(`generates options for ${condition}`, async () => {
            const testSpecOptions = new SpecOptions({
              currentProject: 'path/to/myProject',
              codeGenPath: `${tmpPath}/${fileName}`,
              codeGenType: 'component',
              isDefaultSpecPattern: true,
              specPattern: [defaultSpecPattern.component],
              framework: CT_FRAMEWORKS[1],
            })

            await fs.outputFile(`${tmpPath}/${fileName}`, '// foo')

            const result = await testSpecOptions.getCodeGenOptions()

            expect(result.codeGenType).to.eq('component')
            expect(result.fileName).to.eq(expectedFileName)
            expect(result['componentName']).to.eq(expectedComponentName)
          })
        })
      })
    })
  })
})
