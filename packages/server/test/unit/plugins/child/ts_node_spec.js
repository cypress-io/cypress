require('../../../spec_helper')

const tsnode = require('ts-node')

const resolve = require(`../../../../lib/util/resolve`)

const tsNodeUtil = require('../../../../lib/plugins/child/ts_node')

describe('lib/plugins/child/ts_node', () => {
  beforeEach(() => {
    sinon.stub(tsnode, 'register')
    sinon.stub(resolve, 'typescript').returns('typescript/lib/typescript.js')
  })

  describe('typescript registration', () => {
    it('registers ts-node with preserveValueImports if typescript 4.5.0 and above is installed', () => {
      // Since Cypress server is now bundled with Typescript 5, we can no longer stub the typescript object due to
      // API changes (@see https://github.com/microsoft/TypeScript/wiki/API-Breaking-Changes#typescript-50)
      // Cypress no longer supports Typescript 3 and below as of Cypress 13, so this singular test to verify
      // preserveValueImports is present on the compilerOptions above 4.5.0 should be valid enough.
      tsNodeUtil.register('proj-root', '/path/to/plugins/file.js')
      expect(tsnode.register).to.be.calledWith({
        transpileOnly: true,
        compiler: 'typescript/lib/typescript.js',
        dir: '/path/to/plugins',
        compilerOptions: {
          module: 'commonjs',
          moduleResolution: 'node',
          preserveValueImports: false,
        },
        ignore: [
          '(?:^|/)node_modules/',
          '/packages/telemetry/dist/span-exporters/ipc-span-exporter',
          '/packages/telemetry/dist/span-exporters/console-trace-link-exporter',
          '/packages/telemetry/dist/processors/on-start-span-processor',
        ],
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

      // eslint-disable-next-line no-console
      expect(console.warn).not.to.be.calledWith('Missing baseUrl in compilerOptions. tsconfig-paths will be skipped')
    })
  })
})
