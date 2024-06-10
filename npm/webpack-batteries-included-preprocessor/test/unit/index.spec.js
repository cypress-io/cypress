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
    const mockTsconfigPath = '/path/to/tsconfig.json'
    let readFileTsConfigMock
    let preprocessor
    let readFileTsConfigStub
    let webpackOptions

    beforeEach(() => {
      const tsConfigPathSpy = sinon.spy()

      readFileTsConfigMock = () => {
        throw new Error('Could not read file!')
      }

      mock('tsconfig-paths-webpack-plugin', tsConfigPathSpy)
      mock('@cypress/webpack-preprocessor', (options) => {
        return (file) => undefined
      })

      const tsconfig = require('tsconfig-aliased-for-wbip')

      sinon.stub(tsconfig, 'findSync').callsFake(() => mockTsconfigPath)

      preprocessor = require('../../index')

      const fs = require('fs-extra')

      readFileTsConfigStub = sinon.stub(fs, 'readFileSync').withArgs(mockTsconfigPath, 'utf8').callsFake(() => {
        return readFileTsConfigMock()
      })

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

    it('always returns compilerOptions even if there is an error discovering the user\'s tsconfig.json', () => {
      const preprocessorCB = preprocessor({
        typescript: true,
        webpackOptions,
      })

      preprocessorCB({
        filePath: 'foo.ts',
        outputPath: '.js',
      })

      sinon.assert.calledOnce(readFileTsConfigStub)
      const tsLoader = webpackOptions.module.rules[0].use[0]

      expect(tsLoader.loader).to.contain('ts-loader')

      expect(tsLoader.options.compiler).to.be.true
      expect(tsLoader.options.logLevel).to.equal('error')
      expect(tsLoader.options.silent).to.be.true
      expect(tsLoader.options.transpileOnly).to.be.true

      const compilerOptions = tsLoader.options.compilerOptions

      expect(compilerOptions.downlevelIteration).to.be.true
      expect(compilerOptions.inlineSources).to.be.true
      expect(compilerOptions.inlineSources).to.be.true
      expect(compilerOptions.sourceMap).to.be.false
    })

    it('turns inlineSourceMaps on by default even if none are configured', () => {
      // make json5 compat schema
      const mockTsConfig = `{
          "compilerOptions": {
            "sourceMap": false,
            "someConfigWithTrailingComma": true,
          }
        }`

      readFileTsConfigMock = () => mockTsConfig

      const preprocessorCB = preprocessor({
        typescript: true,
        webpackOptions,
      })

      preprocessorCB({
        filePath: 'foo.ts',
        outputPath: '.js',
      })

      sinon.assert.calledOnce(readFileTsConfigStub)
      const tsLoader = webpackOptions.module.rules[0].use[0]

      expect(tsLoader.loader).to.contain('ts-loader')

      const compilerOptions = tsLoader.options.compilerOptions

      expect(compilerOptions.downlevelIteration).to.be.true
      expect(compilerOptions.inlineSources).to.be.true
      expect(compilerOptions.inlineSources).to.be.true
      expect(compilerOptions.sourceMap).to.be.false
    })

    it('turns on sourceMaps and disables inlineSourceMap and inlineSources if the sourceMap configuration option is set by the user', () => {
      // make json5 compat schema
      const mockTsConfig = `{
          "compilerOptions": {
            "sourceMap": true,
            "someConfigWithTrailingComma": true,
          }
        }`

      readFileTsConfigMock = () => mockTsConfig

      const preprocessorCB = preprocessor({
        typescript: true,
        webpackOptions,
      })

      preprocessorCB({
        filePath: 'foo.ts',
        outputPath: '.js',
      })

      sinon.assert.calledOnce(readFileTsConfigStub)
      const tsLoader = webpackOptions.module.rules[0].use[0]

      expect(tsLoader.loader).to.contain('ts-loader')

      const compilerOptions = tsLoader.options.compilerOptions

      expect(compilerOptions.downlevelIteration).to.be.true
      expect(compilerOptions.inlineSources).to.be.false
      expect(compilerOptions.inlineSources).to.be.false
      expect(compilerOptions.sourceMap).to.be.true
    })
  })
})
