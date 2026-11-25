import { vi, describe, it, expect } from 'vitest'

import type { Plugin } from 'vite-8'
import type { ViteDevServerConfig } from '../../src/devServer'
import type { Vite } from '../../src/getVite'
import { CypressSourcemap } from '../../src/plugins'

describe('sourcemap plugin', () => {
  ['js', 'jsx', 'ts', 'tsx', 'vue', 'svelte', 'mjs', 'cjs'].forEach((ext) => {
    it(`should append sourcemap to the code if sourceMappingURL is not present for files with extension ${ext}`, () => {
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

        expect(result.code).to.eq('console.log("hello world")\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==')
      } else {
        throw new Error('transform is not a function')
      }
    })

    it(`should replace sourceMappingURL with sourcemap and handle query parameters for files with extension ${ext}`, () => {
      const code = 'console.log("hello world")\n//# sourceMappingURL=old-url'
      const id = `test.${ext}?v=12345`
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

    plugin.getCombinedSourcemap = vi.fn()

    expect(plugin.name).to.equal('cypress:sourcemap')
    expect(plugin.enforce).to.equal('post')

    if (plugin.transform instanceof Function) {
      const result = plugin.transform.call(plugin, code, id)

      expect(result).toBeUndefined()
      expect(plugin.getCombinedSourcemap).not.toHaveBeenCalled()
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

    plugin.getCombinedSourcemap = vi.fn()

    expect(plugin.name).to.equal('cypress:sourcemap')
    expect(plugin.enforce).to.equal('post')

    if (plugin.transform instanceof Function) {
      const result = plugin.transform.call(plugin, code, id)

      expect(result).toBeUndefined()
      expect(plugin.getCombinedSourcemap).not.toHaveBeenCalled()
    } else {
      throw new Error('transform is not a function')
    }
  })

  it('should append sourcemap regardless of the extension case', () => {
    const plugin = CypressSourcemap({} as ViteDevServerConfig, {} as Vite) as Plugin & { getCombinedSourcemap: () => { toUrl: () => string } }

    plugin.getCombinedSourcemap = () => {
      return {
        toUrl: () => 'data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==',
      }
    }

    if (!(plugin.transform instanceof Function)) {
      throw new Error('transform is not a function')
    }

    for (const id of ['Test.JS', 'Test.Tsx', 'Test.VUE?v=1']) {
      const result = plugin.transform.call(plugin, 'console.log("hello world")', id)

      expect(result.code).to.eq('console.log("hello world")\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==')
    }
  })

  it('should not append sourcemap when a js extension is only a prefix or infix of the real extension', () => {
    const plugin = CypressSourcemap({} as ViteDevServerConfig, {} as Vite) as Plugin & { getCombinedSourcemap: () => { toUrl: () => string } }

    plugin.getCombinedSourcemap = vi.fn()

    if (!(plugin.transform instanceof Function)) {
      throw new Error('transform is not a function')
    }

    for (const id of ['test.json', 'test.js.map', 'test.tsbuildinfo', 'test.vue.css', 'testjs']) {
      expect(plugin.transform.call(plugin, 'console.log("hello world")', id)).toBeUndefined()
    }

    expect(plugin.getCombinedSourcemap).not.toHaveBeenCalled()
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
