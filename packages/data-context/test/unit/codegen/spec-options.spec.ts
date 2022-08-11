import { defaultSpecPattern } from '@packages/config'
import { WIZARD_FRAMEWORKS } from '@packages/scaffold-config'
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
          const testSpecOptions = new SpecOptions(sinon.fake(), {
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
        const testSpecOptions = new SpecOptions(sinon.fake(), {
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
        const testSpecOptions = new SpecOptions(sinon.fake(), {
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

      it('generates options with given codeGenType', async () => {
        const testSpecOptions = new SpecOptions(sinon.fake(), {
          currentProject: 'path/to/myProject',
          codeGenPath: `${tmpPath}/TestName.js`,
          codeGenType: 'component',
          isDefaultSpecPattern: true,
          framework: WIZARD_FRAMEWORKS[1],
          specPattern: [defaultSpecPattern.component],
        })

        const result = await testSpecOptions.getCodeGenOptions()

        expect(result.codeGenType).to.eq('component')
      })

      it('generates options for Vue app with custom spec pattern', async () => {
        const mockGetDefaultSpecFileName = sinon.fake(({ name }) => {
          return Promise.resolve(`src/specs-folder/${name}.cy.js`)
        })

        const currentProject = 'path/to/myProject'
        const specPattern = ['src/specs-folder/*.cy.{js,jsx}']
        const componentName = 'MyComponent'

        const testSpecOptions = new SpecOptions(mockGetDefaultSpecFileName, {
          currentProject,
          codeGenPath: `${tmpPath}/${componentName}.vue`,
          codeGenType: 'component',
          isDefaultSpecPattern: false,
          framework: WIZARD_FRAMEWORKS[1],
          specPattern,
        })

        const result = await testSpecOptions.getCodeGenOptions()

        expect(mockGetDefaultSpecFileName).calledOnceWith({
          currentProject,
          specPattern,
          testingType: 'component',
          fileExtensionToUse: 'js',
          name: componentName })

        expect(result.codeGenType).to.eq('component')
        expect(result.overrideCodeGenDir).to.eq('src/specs-folder')
      })
    })

    context('duplicate files names', () => {
      for (const specExtension of expectedSpecExtensions) {
        it(`generates options for file name with extension ${specExtension}`, async () => {
          const testSpecOptions = new SpecOptions(sinon.fake(), {
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
        const testSpecOptions = new SpecOptions(sinon.fake(), {
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
        const testSpecOptions = new SpecOptions(sinon.fake(), {
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
    })
  })
})
