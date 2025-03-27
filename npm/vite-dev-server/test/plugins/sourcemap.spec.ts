import { Plugin } from 'vite-5'
import { ViteDevServerConfig } from '../../src/devServer'
import { Vite } from '../../src/getVite'
import { CypressSourcemap } from '../../src/plugins'
import Chai, { expect } from 'chai'
import SinonChai from 'sinon-chai'
import sinon from 'sinon'

Chai.use(SinonChai)

describe('sourcemap plugin', () => {
  ['js', 'jsx', 'ts', 'tsx', 'vue', 'svelte', 'mjs', 'cjs'].forEach((ext) => {
    it(`should append sourcemap to the code if sourceMappingURL is not present for files with extension ${ext}`, () => {
      const code = 'console.log("hello world")'
      const id = `test.js`
      const options = {} as ViteDevServerConfig
      const vite = {} as Vite
      const plugin = CypressSourcemap(options, vite) as Plugin & { getCombinedSourcemap: () => { toUrl: () => string } }

      plugin.getCombinedSourcemap = () => {
        return {
          toUrl: () => 'data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==',
        }
      }

      expect(plugin.name).to.equal('cypress:sourcemap')
      expect(plugin.enforce).to.equal('post')

      if (plugin.transform instanceof Function) {
        const result = plugin.transform.call(plugin, code, id)

        expect(result.code).to.eq('console.log("hello world")\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==')
      } else {
        throw new Error('transform is not a function')
      }
    })

    it(`should replace sourceMappingURL with sourcemap and handle query parameters for files with extension ${ext}`, () => {
      const code = 'console.log("hello world")\n//# sourceMappingURL=old-url'
      const id = `test.js?v=12345`
      const options = {} as ViteDevServerConfig
      const vite = {} as Vite
      const plugin = CypressSourcemap(options, vite) as Plugin & { getCombinedSourcemap: () => { toUrl: () => string } }

      plugin.getCombinedSourcemap = () => {
        return {
          toUrl: () => 'data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==',
        }
      }

      expect(plugin.name).to.equal('cypress:sourcemap')
      expect(plugin.enforce).to.equal('post')

      if (plugin.transform instanceof Function) {
        const result = plugin.transform.call(plugin, code, id)

        expect(result.code).to.eq('console.log("hello world")\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==')
      } else {
        throw new Error('transform is not a function')
      }
    })
  })

  it('should not append sourcemap to the code if sourceMappingURL is already present', () => {
    const code = 'console.log("hello world")\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozfQ=='
    const id = `test.js`
    const options = {} as ViteDevServerConfig
    const vite = {} as Vite
    const plugin = CypressSourcemap(options, vite) as Plugin & { getCombinedSourcemap: () => { toUrl: () => string } }

    plugin.getCombinedSourcemap = sinon.stub()

    expect(plugin.name).to.equal('cypress:sourcemap')
    expect(plugin.enforce).to.equal('post')

    if (plugin.transform instanceof Function) {
      const result = plugin.transform.call(plugin, code, id)

      expect(result).to.be.undefined
      expect(plugin.getCombinedSourcemap).not.to.have.been.called
    } else {
      throw new Error('transform is not a function')
    }
  })

  it('should not append sourcemap to the code if the file is not a js, jsx, ts, tsx, vue, mjs, or cjs file', () => {
    const code = 'console.log("hello world")'
    const id = `test.css`
    const options = {} as ViteDevServerConfig
    const vite = {} as Vite
    const plugin = CypressSourcemap(options, vite) as Plugin & { getCombinedSourcemap: () => { toUrl: () => string } }

    plugin.getCombinedSourcemap = sinon.stub()

    expect(plugin.name).to.equal('cypress:sourcemap')
    expect(plugin.enforce).to.equal('post')

    if (plugin.transform instanceof Function) {
      const result = plugin.transform.call(plugin, code, id)

      expect(result).to.be.undefined
      expect(plugin.getCombinedSourcemap).not.to.have.been.called
    } else {
      throw new Error('transform is not a function')
    }
  })

  it('should not touch sourceMappingURL if it is part of the code', () => {
    const code = 'console.log("\n//# sourceMappingURL=")'
    const id = `test.js`
    const options = {} as ViteDevServerConfig
    const vite = {} as Vite
    const plugin = CypressSourcemap(options, vite) as Plugin & { getCombinedSourcemap: () => { toUrl: () => string } }

    plugin.getCombinedSourcemap = () => {
      return {
        toUrl: () => 'data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==',
      }
    }

    expect(plugin.name).to.equal('cypress:sourcemap')
    expect(plugin.enforce).to.equal('post')

    if (plugin.transform instanceof Function) {
      const result = plugin.transform.call(plugin, code, id)

      expect(result.code).to.eq('console.log("\n//# sourceMappingURL=")\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==')
    } else {
      throw new Error('transform is not a function')
    }
  })
})
