import { describe, it, beforeEach, expect } from 'vitest'
import { EventEmitter } from 'events'
import fs from 'fs-extra'
import path from 'path'
import preprocessor from '../../dist/index'

const fixturesDir = path.join(__dirname, '..', 'fixtures')
const outputDir = path.join(__dirname, '..', '_test-output')

const run = (fileName: string, options?: any) => {
  const file = Object.assign(new EventEmitter(), {
    filePath: path.join(outputDir, fileName),
    outputPath: path.join(outputDir, fileName.replace('.', '_output.')),
  })

  return preprocessor(options)(file)
}

const runAndEval = async (fileName: string, options?: any) => {
  const outputPath = await run(fileName, options)
  const contents = await fs.readFile(outputPath)

  eval(contents.toString())
}

describe('webpack-batteries-included-preprocessor features', () => {
  beforeEach(async () => {
    preprocessor.__reset()

    await fs.remove(outputDir)
    await fs.copy(fixturesDir, outputDir)
  })

  it('handles module interop, object spread, class properties, and async/await', async () => {
    await runAndEval('es_features_spec.js')
  })

  it('handles jsx', async () => {
    await runAndEval('jsx_spec.jsx')
  })

  it('handles mjs', async () => {
    await runAndEval('mjs_spec.mjs')
  })

  it('handles coffeescript', async () => {
    await runAndEval('coffee_spec.coffee')
  })

  it('handles import default export in coffeescript', async () => {
    await runAndEval('coffee_imports_spec.coffee')
  })

  it('handles importing .js, .json, .jsx, .mjs, and .coffee', async () => {
    await runAndEval('various_imports_spec.js')
  })

  it('shims node globals', async () => {
    await runAndEval('node_shim_spec.js')
  })

  it('outputs inline source map', async () => {
    const outputPath = await run('es_features_spec.js')
    const contents = await fs.readFile(outputPath)

    expect(contents.toString()).toContain('//# sourceMappingURL=data:application/json;charset=utf-8;base64')
  })

  describe('with typescript option set', () => {
    const shouldntResolve = () => {
      throw new Error('Should error, should not resolve')
    }

    // TODO: will need to use the module API in the future to replace this
    const options = { typescript: require.resolve('typescript') }

    it('handles typescript (and tsconfig paths)', async () => {
      await runAndEval('ts_spec.ts', { ...options })
    })

    it('handles tsconfig paths without baseUrl (TypeScript 6+ style)', async () => {
      await runAndEval('paths-no-baseurl/spec.ts', { ...options })
    })

    it('handles tsx', async () => {
      await runAndEval('tsx_spec.tsx', { ...options })
    })

    it('handles importing .ts and .tsx', async () => {
      await runAndEval('typescript_imports_spec.js', { ...options })
    })

    it('handles importing ESM .ts and .mts', async () => {
      await runAndEval('typescript_esm_imports_spec.js', { ...options })
    })

    it('handles esModuleInterop: false (default)', async () => {
      await runAndEval('typescript_esmoduleinterop_false_spec.ts', { ...options })
    })

    it('handles esModuleInterop: true', async () => {
      await runAndEval('esmoduleinterop-true/typescript_esmoduleinterop_true_spec.ts', { ...options })
    })

    // https://github.com/cypress-io/cypress/issues/15767
    // defaultOptions don't have typescript config baked in since it requires
    // the path to typescript and the file, so it needs to be added later
    it('adds typescript support if using defaultOptions', async () => {
      await runAndEval('tsx_spec.tsx', { ...options, ...preprocessor.defaultOptions })
    })

    it('errors when processing .ts file and typescript option is not set', async () => {
      try {
        await run('ts_spec.ts')
        shouldntResolve()
      } catch (err) {
        expect(err.message).toContain('You are attempting to run a TypeScript file, but do not have TypeScript installed. Ensure you have \'typescript\' installed to enable TypeScript support')
        expect(err.message).toContain('ts_spec.ts')
      }
    })

    it('errors when processing .tsx file and typescript option is not set', async () => {
      try {
        await run('tsx_spec.tsx')
        shouldntResolve()
      } catch (err) {
        expect(err.message).toContain('You are attempting to run a TypeScript file, but do not have TypeScript installed. Ensure you have \'typescript\' installed to enable TypeScript support')
        expect(err.message).toContain('tsx_spec.tsx')
      }
    })
  })
})
