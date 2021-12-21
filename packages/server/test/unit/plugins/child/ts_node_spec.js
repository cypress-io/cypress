require('../../../spec_helper')

const tsnode = require('ts-node')

const resolve = require(`../../../../lib/util/resolve`)

const tsNodeUtil = require(`../../../../lib/util/ts_node`)

describe('lib/util/ts_node', () => {
  beforeEach(() => {
    sinon.stub(tsnode, 'register')
    sinon.stub(resolve, 'typescript').returns('/path/to/typescript.js')
  })

  describe('typescript registration', () => {
    it('registers ts-node if typescript is installed', () => {
      tsNodeUtil.register('proj-root', '/path/to/plugins/file.js')

      expect(tsnode.register).to.be.calledWith({
        transpileOnly: true,
        compiler: '/path/to/typescript.js',
        dir: '/path/to/plugins',
        compilerOptions: {
          module: 'CommonJS',
        },
      })
    })

    it('does not register ts-node if typescript is not installed', () => {
      resolve.typescript.returns(null)

      tsNodeUtil.register('proj-root', '/path/to/plugins/file.js')

      expect(tsnode.register).not.to.be.called
    })

    it('prevents tsconfig-paths from logging warning when there is no tsconfig.json', () => {
      sinon.spy(console, 'warn')
      tsNodeUtil.register('proj-root', '/path/to/plugins/file.js')

      expect(console.warn).not.to.be.calledWith('Missing baseUrl in compilerOptions. tsconfig-paths will be skipped')
    })
  })
})
