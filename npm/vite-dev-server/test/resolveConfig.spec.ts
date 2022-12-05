import Chai, { expect } from 'chai'
import { EventEmitter } from 'events'
import * as vite from 'vite'
import { scaffoldSystemTestProject } from './test-helpers/scaffoldProject'
import { createViteDevServerConfig } from '../src/resolveConfig'
import sinon from 'sinon'
import SinonChai from 'sinon-chai'
import type { ViteDevServerConfig } from '../src/devServer'

Chai.use(SinonChai)

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

describe('resolveConfig', function () {
  this.timeout(1000 * 60)

  context('config resolution', () => {
    it('with <project-root>/vite.config.js', async () => {
      const projectRoot = await scaffoldSystemTestProject('vite-inspect')
      const viteDevServerConfig = getViteDevServerConfig(projectRoot)

      const viteConfig = await createViteDevServerConfig(viteDevServerConfig, vite)

      expect(viteConfig.configFile).to.contain('vite-inspect')
      expect(viteConfig.plugins.map((p: any) => p.name)).to.have.members(['cypress:main', 'cypress:sourcemap'])
    })

    it('with component.devServer.viteConfig provided', async () => {
      const projectRoot = await scaffoldSystemTestProject('vite-inspect')
      const inlineViteConfig = { base: '/will-be-overwritten', server: { port: 99999 } }
      const viteDevServerConfig = { ...getViteDevServerConfig(projectRoot), viteConfig: inlineViteConfig }

      const viteConfig = await createViteDevServerConfig(viteDevServerConfig, vite)

      expect(viteConfig.configFile).eq(false)
      expect(viteConfig.base).eq('/__cypress/src/')
      expect(viteConfig.server.port).eq(99999)
    })

    it('calls viteConfig if it is a function', async () => {
      const viteConfigFn = sinon.spy(async () => {
        return {
          server: {
            fs: {
              allow: ['some/other/file'],
            },
          },
        }
      })

      const projectRoot = await scaffoldSystemTestProject('vite-inspect')
      const viteDevServerConfig = {
        ...getViteDevServerConfig(projectRoot),
        viteConfig: viteConfigFn,
      }

      const viteConfig = await createViteDevServerConfig(viteDevServerConfig, vite)

      expect(viteConfigFn).to.be.called
      expect(viteConfig.server?.fs?.allow).to.include('some/other/file')
    })
  })

  context('file watching', () => {
    let viteDevServerConfig: ViteDevServerConfig

    beforeEach(async () => {
      const projectRoot = await scaffoldSystemTestProject('vite-inspect')

      viteDevServerConfig = getViteDevServerConfig(projectRoot)
    })

    it('should be disabled in run mode', async () => {
      viteDevServerConfig.cypressConfig.isTextTerminal = true
      const viteConfig = await createViteDevServerConfig(viteDevServerConfig, vite)

      expect(viteConfig.server?.watch?.ignored).to.eql('**/*')
      expect(viteConfig.server?.hmr).to.be.false
    })

    it('uses defaults in open mode', async () => {
      viteDevServerConfig.cypressConfig.isTextTerminal = false
      const viteConfig = await createViteDevServerConfig(viteDevServerConfig, vite)

      expect(viteConfig.server?.watch?.ignored).to.be.undefined
      expect(viteConfig.server?.hmr).to.be.undefined
    })
  })
})
