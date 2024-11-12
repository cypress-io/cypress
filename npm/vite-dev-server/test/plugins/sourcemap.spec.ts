import { Plugin } from 'vite-5'
import { ViteDevServerConfig } from '../../src/devServer'
import { Vite } from '../../src/getVite'
import { CypressSourcemap } from '../../src/plugins'
import Chai, { expect } from 'chai'
import SinonChai from 'sinon-chai'

Chai.use(SinonChai)

describe('sourcemap plugin', () => {
  ['js', 'jsx', 'ts', 'tsx', 'vue', 'mjs', 'cjs'].forEach((ext) => {
    it('should append sourcemap to the code if sourceMappingURL is not present', () => {
      const code = 'console.log("hello world")'
      const id = `test.${ext}`
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

        expect(result.code).to.include('//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==')
      } else {
        throw new Error('transform is not a function')
      }
    })

    it('should replace sourceMappingURL with sourcemap', () => {
      const code = 'console.log("hello world")\n//# sourceMappingURL=old-url'
      const id = `test.${ext}`
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

        expect(result.code).to.include('//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==')
      } else {
        throw new Error('transform is not a function')
      }
    })
  })
})
