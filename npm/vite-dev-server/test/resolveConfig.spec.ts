import { expect } from 'chai'
import { EventEmitter } from 'events'
import * as vite from 'vite'
import { scaffoldSystemTestProject } from './test-helpers/scaffoldProject'
import { createViteDevServerConfig } from '../src/resolveConfig'
import type { ViteDevServerConfig } from '../src/devServer'

const getViteDevServerConfig = (projectRoot: string) => {
  return {
    specs: [],
    cypressConfig: {
      projectRoot,
    },
    devServerEvents: new EventEmitter(),
    onConfigNotFound: () => {},
    framework: 'react',
    viteConfig: {},
  } as unknown as ViteDevServerConfig
}

describe('resolveConfig', function () {
  this.timeout(1000 * 60)

  context('inspect plugin', () => {
    it('should not include inspect plugin by default', async () => {
      const projectRoot = await scaffoldSystemTestProject('vite-inspect')
      const viteDevServerConfig = getViteDevServerConfig(projectRoot)

      const viteConfig = await createViteDevServerConfig(viteDevServerConfig, vite)

      expect(viteConfig.plugins).to.have.lengthOf(1)
      expect(viteConfig.plugins[0].name).to.equal('cypress:main')
    })

    context('with CYPRESS_INTERNAL_VITE_INSPECT provided', () => {
      before(() => {
        process.env.CYPRESS_INTERNAL_VITE_INSPECT = 'true'
      })

      after(() => {
        process.env.CYPRESS_INTERNAL_VITE_INSPECT = undefined
      })

      it('should add inspect plugin', async () => {
        const projectRoot = await scaffoldSystemTestProject('vite-inspect')
        const viteDevServerConfig = getViteDevServerConfig(projectRoot)

        const viteConfig = await createViteDevServerConfig(viteDevServerConfig, vite)

        expect(viteConfig.plugins).to.have.lengthOf(2)
        expect(viteConfig.plugins[1].name).to.equal('cypress:inspect')
      })

      it('should not add inspect plugin if not installed', async () => {
        const projectRoot = await scaffoldSystemTestProject('vite2.9.1-react')
        const viteDevServerConfig = getViteDevServerConfig(projectRoot)

        const viteConfig = await createViteDevServerConfig(viteDevServerConfig, vite)

        expect(viteConfig.plugins).to.have.lengthOf(1)
        expect(viteConfig.plugins[0].name).to.equal('cypress:main')
      })
    })
  })
})
