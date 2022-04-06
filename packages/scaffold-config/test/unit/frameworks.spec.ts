import { expect } from 'chai'
import dedent from 'dedent'
import path from 'path'
import { createCypressConfig } from '../../src/frameworks'

const monorepoRoot = path.join(__dirname, '..', '..', '..', '..')

describe('createCypressConfig', () => {
  it('handles TypeScript without `defineConfig`', () => {
    const actual = createCypressConfig({
      language: 'ts',
      framework: 'create-react-app',
      bundler: 'webpack',
      projectRoot: '/',
    })

    const expected = dedent`
      export default {
        component: {
          devServer: {
            framework: 'create-react-app',
            bundler: 'webpack'
          }
        }
      }`

    expect(actual).to.eq(expected)
  })

  it('handles TypeScript with `defineConfig`', () => {
    const actual = createCypressConfig({
      language: 'ts',
      framework: 'create-react-app',
      bundler: 'webpack',
      projectRoot: monorepoRoot,
    })

    const expected = dedent`
      import { defineConfig } from 'cypress'

      export default defineConfig({
        component: {
          devServer: {
            framework: 'create-react-app',
            bundler: 'webpack'
          }
        }
      })`

    expect(actual).to.eq(expected)
  })

  it('handles JavaScript', () => {
    const actual = createCypressConfig({
      language: 'js',
      framework: 'create-react-app',
      bundler: 'webpack',
      projectRoot: monorepoRoot,
    })

    const expected = dedent`
      module.exports = {
        component: {
          devServer: {
            framework: 'create-react-app',
            bundler: 'webpack'
          }
        }
      }`

    expect(actual).to.eq(expected)
  })
})
