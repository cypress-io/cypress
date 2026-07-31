import path from 'path'
import { fileURLToPath } from 'node:url'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import { EventEmitter } from 'events'
import * as vite5 from 'vite-5'
import * as vite6 from 'vite-6'
import * as vite7 from 'vite-7'
import * as vite8 from 'vite-8'
import { scaffoldSystemTestProject } from './test-helpers/scaffoldProject'
import { createViteDevServerConfig, JSX_REFRESH_SCRIPT_RE } from '../src/resolveConfig'
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
const MAJOR_VERSIONS: ({version: 5, vite: any } | {version: 6, vite: any } | {version: 7, vite: any })[] = [

  {
    version: 5,
    vite: vite5,
  },
  {
    version: 6,
    vite: vite6,
  },
  {
    version: 7,
    vite: vite7,
  },
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

        expect(viteConfigFn).toBeCalled
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
        expect(viteConfig.server?.hmr).to.be.false
      })

      it('uses defaults in open mode', async () => {
        viteDevServerConfig.cypressConfig.isTextTerminal = false
        const viteConfig = await createViteDevServerConfig(viteDevServerConfig, discoveredVite)

        expect(viteConfig.server?.watch?.ignored).to.be.undefined
        expect(viteConfig.server?.hmr).to.be.undefined
      })
    })
  })

  describe('Vite 8 JSX refresh excludes component specs', () => {
    // Real package root so createRequire can resolve `vite` like a consumer project; inline viteConfig skips fixture scaffolding.
    const viteDevServerPackageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

    it('sets oxc.jsxRefreshInclude and jsxRefreshExclude from Cypress specs (Vite 8)', async () => {
      const specAbsolutes = [
        path.join(viteDevServerPackageRoot, 'src', 'Hello.cy.tsx'),
        path.join(viteDevServerPackageRoot, 'src', 'Other.cy.tsx'),
      ]
      const viteDevServerConfig = {
        ...getViteDevServerConfig(viteDevServerPackageRoot),
        viteConfig: {},
        specs: [
          { absolute: specAbsolutes[0], relative: 'src/Hello.cy.tsx' },
          { absolute: specAbsolutes[1], relative: 'src/Other.cy.tsx' },
        ],
      } as unknown as ViteDevServerConfig

      const viteConfig = await createViteDevServerConfig(viteDevServerConfig, vite8)

      expect(viteConfig.oxc?.jsxRefreshInclude).to.equal(JSX_REFRESH_SCRIPT_RE)
      expect(viteConfig.oxc?.jsxRefreshExclude).to.eql(specAbsolutes)
    })

    it('does not set oxc overrides for Vite 7', async () => {
      const specAbsolute = path.join(viteDevServerPackageRoot, 'components', 'Card.cy.tsx')
      const viteDevServerConfig = {
        ...getViteDevServerConfig(viteDevServerPackageRoot),
        viteConfig: {},
        specs: [{ absolute: specAbsolute, relative: 'components/Card.cy.tsx' }],
      } as unknown as ViteDevServerConfig

      const viteConfig = await createViteDevServerConfig(viteDevServerConfig, vite7)

      expect(viteConfig.oxc).to.be.undefined
    })

    it('matches only script-like paths so imported CSS (e.g. support files) is not run through transformWithOxc', () => {
      expect(JSX_REFRESH_SCRIPT_RE.test('/project/cypress/support/backgroundColor.css')).to.be.false
      expect(JSX_REFRESH_SCRIPT_RE.test('/project/src/App.cy.tsx')).to.be.true
    })
  })
}, 1000 * 60)
