import { describe, it, expect } from 'vitest'

/**
 * as of Webpack 5, dependencies that are polyfilled through the Provide plugin must be defined inside the CLI
 * in order to guarantee there is a version of the dependency accessible by the cypress CLI, either in the cypress directory
 * or the root of their project. Currently, these two dependencies are 'buffer' and 'process'
 */
describe('dependencies', () => {
  it('process dependency exists in package.json and is available', async () => {
    // @ts-expect-error resolveJsonModule is set to true in tsconfig.json
    const { dependencies } = (await import('../../../package.json')).default

    expect(dependencies.process).toBeDefined()

    const process = await import('process')

    expect(typeof process).toEqual('object')
  })

  it('buffer dependency exists in package.json and is available', async () => {
    // @ts-expect-error resolveJsonModule is set to true in tsconfig.json

    const { dependencies } = (await import('../../../package.json')).default

    expect(dependencies.buffer).toBeDefined()

    const buffer = await import('buffer')

    expect(typeof buffer).toEqual('object')
  })
})
