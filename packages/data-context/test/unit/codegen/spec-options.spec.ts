import { expect } from 'chai'
import fs from 'fs-extra'
import path from 'path'
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
        it(`generates options for name names with extension ${specExtension}`, async () => {
          const testSpecOptions = new SpecOptions(ctx, {
            codeGenPath: `${tmpPath}/TestName${specExtension}.js`,
            codeGenType: 'e2e',
          })

          const result = await testSpecOptions.getCodeGenOptions()

          expect(result.codeGenType).to.eq('e2e')
          expect(result.fileName).to.eq(`TestName${specExtension}.js`)
        })
      }

      it('generates options for file name without spec extension', async () => {
        const testSpecOptions = new SpecOptions(ctx, {
          codeGenPath: `${tmpPath}/TestName.js`,
          codeGenType: 'e2e',
        })

        const result = await testSpecOptions.getCodeGenOptions()

        expect(result.codeGenType).to.eq('e2e')
        expect(result.fileName).to.eq(`TestName.js`)
      })

      it('generates options for file name with multiple extensions', async () => {
        const testSpecOptions = new SpecOptions(ctx, {
          codeGenPath: `${tmpPath}/TestName.foo.bar.js`,
          codeGenType: 'e2e',
        })

        const result = await testSpecOptions.getCodeGenOptions()

        expect(result.codeGenType).to.eq('e2e')
        expect(result.fileName).to.eq(`TestName.foo.bar.js`)
      })

      it('generates options with given codeGenType', async () => {
        const testSpecOptions = new SpecOptions(ctx, {
          codeGenPath: `${tmpPath}/TestName.js`,
          codeGenType: 'component',
        })

        const result = await testSpecOptions.getCodeGenOptions()

        expect(result.codeGenType).to.eq('component')
      })
    })

    context('duplicate files names', () => {
      for (const specExtension of expectedSpecExtensions) {
        it(`generates options for file name with extension ${specExtension}`, async () => {
          const testSpecOptions = new SpecOptions(ctx, {
            codeGenPath: `${tmpPath}/TestName${specExtension}.js`,
            codeGenType: 'e2e',
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
        const testSpecOptions = new SpecOptions(ctx, {
          codeGenPath: `${tmpPath}/TestName.js`,
          codeGenType: 'e2e',
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
        const testSpecOptions = new SpecOptions(ctx, {
          codeGenPath: `${tmpPath}/TestName.foo.bar.js`,
          codeGenType: 'e2e',
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
