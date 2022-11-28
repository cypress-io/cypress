require('../../../spec_helper')

const tsnode = require('ts-node')
const typescriptObject = require('typescript/lib/typescript.js')

const resolve = require(`../../../../lib/util/resolve`)

const tsNodeUtil = require('../../../../lib/plugins/child/ts_node')

describe('lib/plugins/child/ts_node', () => {
  beforeEach(() => {
    sinon.stub(tsnode, 'register')
    sinon.stub(resolve, 'typescript').returns('typescript/lib/typescript.js')
  })

  describe('typescript registration', () => {
    it('registers ts-node if typescript is installed', () => {
      sinon.stub(typescriptObject, 'version').value('1.1.1')
      tsNodeUtil.register('proj-root', '/path/to/plugins/file.js')

      expect(tsnode.register).to.be.calledWith({
        transpileOnly: true,
        compiler: 'typescript/lib/typescript.js',
        dir: '/path/to/plugins',
        compilerOptions: {
          module: 'commonjs',
        },
      })
    })

    it('registers ts-node with preserveValueImports if typescript 4.5.0 is installed', () => {
      sinon.stub(typescriptObject, 'version').value('4.5.0')
      tsNodeUtil.register('proj-root', '/path/to/plugins/file.js')

      expect(tsnode.register).to.be.calledWith({
        transpileOnly: true,
        compiler: 'typescript/lib/typescript.js',
        dir: '/path/to/plugins',
        compilerOptions: {
          module: 'commonjs',
          preserveValueImports: false,
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
