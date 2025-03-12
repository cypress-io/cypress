const { expect } = require('chai')
const decache = require('decache')
const mock = require('mock-require')
const sinon = require('sinon')

describe('webpack-batteries-included-preprocessor', () => {
  beforeEach(() => {
    decache('../../index')
  })

  context('#getFullWebpackOptions', () => {
    let preprocessor

    beforeEach(() => {
      preprocessor = require('../../index')
    })

    it('returns default webpack options (and does not add typescript config if no path specified)', () => {
      const result = preprocessor.getFullWebpackOptions()

      expect(result.node.global).to.be.true
      expect(result.module.rules).to.have.length(3)
      expect(result.resolve.extensions).to.eql(['.js', '.json', '.jsx', '.mjs', '.coffee'])
    })

    it('adds typescript config if path is specified', () => {
      const result = preprocessor.getFullWebpackOptions('file/path', 'typescript/path')

      expect(result.module.rules).to.have.length(4)
      expect(result.module.rules[3].use[0].loader).to.include('ts-loader')
    })
  })

  context('#getTSCompilerOptionsForUser', () => {
    let getTsConfigMock
    let preprocessor
    let webpackOptions

    beforeEach(() => {
      const tsConfigPathSpy = sinon.spy()

      mock('tsconfig-paths-webpack-plugin', tsConfigPathSpy)
      mock('@cypress/webpack-preprocessor', (options) => {
        return (file) => undefined
      })

      const getTsConfig = require('get-tsconfig')

      getTsConfigMock = sinon.stub(getTsConfig, 'getTsconfig')

      preprocessor = require('../../index')

      webpackOptions = {
        module: {
          rules: [],
        },
        resolve: {
          extensions: [],
          plugins: [],
        },
      }
    })

    afterEach(() => {
      // Remove the mock
      mock.stop('tsconfig-paths-webpack-plugin')
      mock.stop('@cypress/webpack-preprocessor')
    })

    it('always returns compilerOptions and sets sourceMap=true even if there is an error discovering the user\'s tsconfig.json', () => {
      getTsConfigMock.returns(null)

      const preprocessorCB = preprocessor({
        typescript: true,
        webpackOptions,
      })

      preprocessorCB({
        filePath: 'foo.ts',
        outputPath: '.js',
      })

      const tsLoader = webpackOptions.module.rules[0].use[0]

      expect(tsLoader.loader).to.contain('ts-loader')

      expect(tsLoader.options.compiler).to.be.true
      expect(tsLoader.options.logLevel).to.equal('error')
      expect(tsLoader.options.silent).to.be.true
      expect(tsLoader.options.transpileOnly).to.be.true

      const compilerOptions = tsLoader.options.compilerOptions

      expect(compilerOptions.downlevelIteration).to.be.true
      expect(compilerOptions.inlineSources).to.be.false
      expect(compilerOptions.inlineSources).to.be.false
      expect(compilerOptions.sourceMap).to.be.true
    })

    // NOTE: this test doesn't really verify much except a side effect until https://github.com/cypress-io/cypress/issues/31282 is complete
    it('turns inlineSourceMaps off by default and sourceMaps on regardless of user config', () => {
      getTsConfigMock.returns({
        path: '/path/to/fully/resolved/tsconfig.json',
        config: {
          compilerOptions: {
            sourceMap: false,
            inlineSourceMap: true,
          },
        },
      })

      const preprocessorCB = preprocessor({
        typescript: true,
        webpackOptions,
      })

      preprocessorCB({
        filePath: 'foo.ts',
        outputPath: '.js',
      })

      const tsLoader = webpackOptions.module.rules[0].use[0]

      expect(tsLoader.loader).to.contain('ts-loader')

      const compilerOptions = tsLoader.options.compilerOptions

      expect(compilerOptions.downlevelIteration).to.be.true
      expect(compilerOptions.inlineSourceMap).to.be.false
      expect(compilerOptions.inlineSources).to.be.false
      expect(compilerOptions.sourceMap).to.be.true
    })
  })
})
