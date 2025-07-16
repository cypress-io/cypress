import { vi, describe, it, beforeEach, expect } from 'vitest'
import { EventEmitter } from 'events'
import * as vite5 from 'vite-5'
import * as vite6 from 'vite-6'
import * as vite7 from 'vite-7'
import { scaffoldSystemTestProject } from './test-helpers/scaffoldProject'
import { createViteDevServerConfig } from '../src/resolveConfig'
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
}, 1000 * 60)
