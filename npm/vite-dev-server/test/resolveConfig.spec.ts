import path from 'path'
import { fileURLToPath } from 'node:url'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import { EventEmitter } from 'events'
import * as vite8 from 'vite-8'
import { scaffoldSystemTestProject } from './test-helpers/scaffoldProject'
import { createViteDevServerConfig } from '../src/resolveConfig'
import { JSX_REFRESH_SCRIPT_RE } from '../src/plugins/cypress'
import type { ViteDevServerConfig } from '../src/devServer'

const getViteDevServerConfig = (projectRoot: string) => {
  return {
    specs: [],
    cypressConfig: {
      projectRoot,
      devServerPublicPathRoute: '/__cypress/src',
    },
    devServerEvents: new EventEmitter(),
    onConfigNotFound: () => {},
    framework: 'react',
  } as unknown as ViteDevServerConfig
}
const MAJOR_VERSIONS: ({ version: 8, vite: typeof vite8 })[] = [
  {
    version: 8,
    vite: vite8,
  },
]

describe('resolveConfig', function () {
  MAJOR_VERSIONS.forEach(({ version, vite: discoveredVite }) => {
    describe(`config resolution: v${version}`, () => {
      it('with <project-root>/vite.config.js', async () => {
        const projectRoot = await scaffoldSystemTestProject(`vite${version}-inspect`)
        const viteDevServerConfig = getViteDevServerConfig(projectRoot)

        const viteConfig = await createViteDevServerConfig(viteDevServerConfig, discoveredVite)

        expect(viteConfig.configFile).to.contain(`vite${version}-inspect`)
        expect(viteConfig.plugins.map((p: any) => p.name)).to.have.members(['cypress:main', 'cypress:sourcemap'])
      })

      it('with component.devServer.viteConfig provided', async () => {
        const projectRoot = await scaffoldSystemTestProject(`vite${version}-inspect`)
        const inlineViteConfig = { base: '/will-be-overwritten', server: { port: 99999 } }
        const viteDevServerConfig = { ...getViteDevServerConfig(projectRoot), viteConfig: inlineViteConfig }

        const viteConfig = await createViteDevServerConfig(viteDevServerConfig, discoveredVite)

        expect(viteConfig.configFile).eq(false)
        expect(viteConfig.base).eq('/__cypress/src/')
        expect(viteConfig.server.port).eq(99999)
      })

      it('calls viteConfig if it is a function', async () => {
        const viteConfigFn = vi.fn().mockImplementation(async () => {
          return {
            server: {
              fs: {
                allow: ['some/other/file'],
              },
            },
          }
        })

        const projectRoot = await scaffoldSystemTestProject(`vite${version}-inspect`)
        const viteDevServerConfig = {
          ...getViteDevServerConfig(projectRoot),
          viteConfig: viteConfigFn,
        }

        const viteConfig = await createViteDevServerConfig(viteDevServerConfig, discoveredVite)

        expect(viteConfigFn).toHaveBeenCalled()
        expect(viteConfig.server?.fs?.allow).to.include('some/other/file')
      })
    })

    describe('file watching', () => {
      let viteDevServerConfig: ViteDevServerConfig

      beforeEach(async () => {
        const projectRoot = await scaffoldSystemTestProject(`vite${version}-inspect`)

        viteDevServerConfig = getViteDevServerConfig(projectRoot)
      })

      it('should be disabled in run mode', async () => {
        viteDevServerConfig.cypressConfig.isTextTerminal = true
        const viteConfig = await createViteDevServerConfig(viteDevServerConfig, discoveredVite)

        expect(viteConfig.server?.watch?.ignored).to.eql('**/*')
        expect(viteConfig.server?.hmr).toBe(false)
      })

      it('uses defaults in open mode', async () => {
        viteDevServerConfig.cypressConfig.isTextTerminal = false
        const viteConfig = await createViteDevServerConfig(viteDevServerConfig, discoveredVite)

        expect(viteConfig.server?.watch?.ignored).toBeUndefined()
        expect(viteConfig.server?.hmr).toBeUndefined()
      })
    })
  })

  describe('Vite JSX refresh excludes component specs', () => {
    // Real package root so createRequire can resolve `vite` like a consumer project; inline viteConfig skips fixture scaffolding.
    const viteDevServerPackageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
    const specAbsolutes = [
      path.join(viteDevServerPackageRoot, 'src', 'Hello.cy.tsx'),
      path.join(viteDevServerPackageRoot, 'src', 'Other.cy.tsx'),
    ]
    const supportFile = path.join(viteDevServerPackageRoot, 'cypress', 'support', 'component.jsx')

    const resolveOxc = async (plugins: vite8.PluginOption[]) => {
      const baseConfig = getViteDevServerConfig(viteDevServerPackageRoot)
      const viteDevServerConfig = {
        ...baseConfig,
        cypressConfig: { ...baseConfig.cypressConfig, cypressBinaryRoot: viteDevServerPackageRoot },
        viteConfig: { plugins },
        specs: [
          { absolute: specAbsolutes[0], relative: 'src/Hello.cy.tsx' },
          { absolute: specAbsolutes[1], relative: 'src/Other.cy.tsx' },
        ],
      } as unknown as ViteDevServerConfig

      const viteConfig = await createViteDevServerConfig(viteDevServerConfig, vite8)

      return viteConfig
    }

    // Stands in for `@vitejs/plugin-react`'s `config` hook.
    const reactRefresh = (oxc: vite8.UserConfig['oxc'] = { jsx: { runtime: 'automatic', refresh: true } }): vite8.Plugin => {
      return { name: 'react-refresh-stand-in', enforce: 'pre', config: () => ({ oxc }) }
    }

    // Stands in for `@vitejs/plugin-vue-jsx`: it narrows `oxc.include` and compiles `.jsx` itself.
    // Vite's oxc plugin runs first, so `transform` sees raw JSX only when oxc left the file alone.
    // `load` serves the support file so the test needs no file on disk.
    const vueJsx: vite8.Plugin = {
      name: 'vue-jsx-stand-in',
      config: () => ({ oxc: { include: /\.ts$/ } }),
      resolveId: (id) => id === '/cypress/support/component.jsx' ? supportFile : undefined,
      load: (id) => id === supportFile ? 'export const el = <div class="wrap" />' : undefined,
      transform: (code, id) => {
        if (id === supportFile) {
          return `export const compiledBy = ${JSON.stringify(code.includes('<div') ? 'vue-jsx' : 'oxc')}`
        }
      },
    }

    it('excludes Cypress specs from JSX refresh when React Fast Refresh is on', async () => {
      const viteConfig = await resolveOxc([reactRefresh()])
      const resolved = await vite8.resolveConfig(viteConfig, 'serve')

      expect(resolved.oxc && resolved.oxc.jsxRefreshInclude).to.equal(JSX_REFRESH_SCRIPT_RE)
      expect(resolved.oxc && resolved.oxc.jsxRefreshExclude).to.eql(specAbsolutes)
    })

    it('keeps the JSX refresh filters a plugin already set', async () => {
      const viteConfig = await resolveOxc([reactRefresh({
        jsx: { runtime: 'automatic', refresh: true },
        jsxRefreshInclude: /\.[tj]sx?$/,
        jsxRefreshExclude: /\/node_modules\//,
      })])
      const resolved = await vite8.resolveConfig(viteConfig, 'serve')

      expect(resolved.oxc && resolved.oxc.jsxRefreshInclude).to.eql(/\.[tj]sx?$/)
      expect(resolved.oxc && resolved.oxc.jsxRefreshExclude).to.eql([/\/node_modules\//, ...specAbsolutes])
    })

    it('leaves oxc alone when JSX refresh is off', async () => {
      const viteConfig = await resolveOxc([vueJsx])
      const resolved = await vite8.resolveConfig(viteConfig, 'serve')

      expect(viteConfig.oxc).toBeUndefined()
      expect(resolved.oxc && resolved.oxc.jsxRefreshInclude).toBeUndefined()
      expect(resolved.oxc && resolved.oxc.jsxRefreshExclude).toBeUndefined()
    })

    it('leaves a Vue project\'s non-spec .jsx files to its JSX plugin instead of compiling them as React', async () => {
      const viteConfig = await resolveOxc([vueJsx])
      const server = await vite8.createServer({ ...viteConfig, logLevel: 'silent', server: { ...viteConfig.server, middlewareMode: true, hmr: false } })

      try {
        const result = await server.transformRequest('/cypress/support/component.jsx')

        expect(result?.code).to.contain('compiledBy = "vue-jsx"')
      } finally {
        await server.close()
      }
    })

    it('matches only script-like paths so imported CSS (e.g. support files) is not run through transformWithOxc', () => {
      expect(JSX_REFRESH_SCRIPT_RE.test('/project/cypress/support/backgroundColor.css')).toBe(false)
      expect(JSX_REFRESH_SCRIPT_RE.test('/project/src/App.cy.tsx')).toBe(true)
    })
  })
}, 1000 * 60)
