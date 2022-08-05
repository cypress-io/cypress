import { pathToFileURL } from 'url'
import type { ViteDevServerConfig } from '../devServer'

const dynamicImport = new Function('specifier', 'return import(specifier)')

const importModule = (specifier: string, projectRoot: string) => {
  const depPath = require.resolve(specifier, { paths: [projectRoot] })

  const url = pathToFileURL(depPath).href

  return dynamicImport(url)
}

export async function nuxtHandler (devServerConfig: ViteDevServerConfig) {
  const { projectRoot } = devServerConfig.cypressConfig
  const { loadNuxt } = await importModule('nuxt', projectRoot)
  const { getCtx, getViteClientConfig } = await importModule('@nuxt/vite-builder', projectRoot)

  const nuxt = await loadNuxt({ cwd: projectRoot, dev: true, ready: true })
  const ctx = await getCtx(nuxt)
  const viteClientConfig = getViteClientConfig(ctx)

  viteClientConfig.server.middlewareMode = false
  viteClientConfig.plugins = viteClientConfig.plugins.filter((plugin: any) => plugin.name !== 'replace')

  return viteClientConfig
}
