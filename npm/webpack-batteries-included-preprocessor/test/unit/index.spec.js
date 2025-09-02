const { expect } = require('chai')
const decache = require('decache')
const mock = require('mock-require')
const sinon = require('sinon')
const Debug = require('debug')

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

    it('adds the BundleAnalyzerPlugin if the user is trying to debug their bundle', () => {
      Debug.enable('cypress-verbose:webpack-batteries-included-preprocessor:bundle-analyzer')

      // since debug needs to be hydrated before requiring the preprocessor, we need to decache
      // and require again
      decache('../../index')
      preprocessor = require('../../index')
      const result = preprocessor.getFullWebpackOptions('file/path', 'typescript/path')

      expect(result.plugins).to.have.length(2)
      expect(result.plugins[1].constructor.name).to.equal('BundleAnalyzerPlugin')
      Debug.disable()
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

    it('correctly passes the options in the user\'s tsconfig.json options into ts-loader', () => {
      getTsConfigMock.returns({
        config: {
          compilerOptions: {
            module: 'ESNext',
            moduleResolution: 'Bundler',
          },
        },
        path: require.resolve('../../test/fixtures/tsconfig.json'),
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

      expect(tsLoader.options.compiler).to.equal(require.resolve('typescript'))
      expect(tsLoader.options.logLevel).to.equal('error')
      expect(tsLoader.options.silent).to.be.true
      expect(tsLoader.options.transpileOnly).to.be.true

      // compilerOptions are overridden (sourceMap=true) by `@cypress/webpack-preprocessor` if ts-loader is present
      expect(tsLoader.options.compilerOptions).to.deep.equal({
        module: 'ESNext',
        moduleResolution: 'Bundler',
      })
    })

    it('overrides node10 option as node as they are the same thing and is simpler for ts-loader to parse', () => {
      getTsConfigMock.returns({
        config: {
          compilerOptions: {
            module: 'commonjs',
            moduleResolution: 'node10',
          },
        },
        path: require.resolve('../../test/fixtures/tsconfig.json'),
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

      expect(tsLoader.options.compilerOptions).to.deep.equal({
        module: 'commonjs',
        moduleResolution: 'node',
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/18938. ts-loader needs a tsconfig.json file to work.
    it('throws an error if the user\'s tsconfig.json is not found', () => {
      getTsConfigMock.returns(null)

      const preprocessorCB = preprocessor({
        typescript: true,
        webpackOptions,
      })

      expect(() => {
        return preprocessorCB({
          filePath: 'foo.ts',
          outputPath: '.js',
        })
      }).to.throw('No tsconfig.json found. ts-loader needs a tsconfig.json file to work. Please add one to your project in either the root or the cypress directory.')
    })

    it('throws an error if the user\'s typescript is not found', () => {
      getTsConfigMock.returns({
        config: {
          compilerOptions: {
            module: 'commonjs',
            moduleResolution: 'node16',
          },
        },
        path: '/does/not/exist',
      })

      const preprocessorCB = preprocessor({
        typescript: true,
        webpackOptions,
      })

      expect(() => {
        return preprocessorCB({
          filePath: 'foo.ts',
          outputPath: '.js',
        })
      }).to.throw('No typescript installable was found. ts-loader needs a version of typescript to work properly. Please install typescript in your project\'s package.json.')
    })
  })
})
