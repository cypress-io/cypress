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
    },
    devServerEvents: new EventEmitter(),
    onConfigNotFound: () => {},
    framework: 'react',
    viteConfig: {},
  } as unknown as ViteDevServerConfig
}

describe('resolveConfig', function () {
  this.timeout(1000 * 60)

  it('calls viteConfig if it is a function, passing in the base config', async () => {
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

  describe('file watching', () => {
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
