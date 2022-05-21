import type { Plugin } from 'vite'
import type { ViteDevServerConfig } from '../devServer'
import { transformIndexHtml } from '../transformIndexHtml'

export const CypressViteErrorPlugin = (devServerConfig: ViteDevServerConfig): Plugin => {
  return {
    name: 'cypress-vite-error-plugin',
    async generateBundle () {
      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: await transformIndexHtml(devServerConfig.cypressConfig.projectRoot, devServerConfig.cypressConfig.indexHtmlFile),
      })
    },
    async resolveId (source, importer, options) {
      const resolution = await this.resolve(source, importer, { skipSelf: true, ...options })

      if (resolution) {
        try {
          await this.load(resolution)
        } catch (error: any) {
          const moduleInfo = this.getModuleInfo(resolution.id)

          if (moduleInfo) {
            const errorMessage = `Module Error (from ${source}):\n${error.message}`

            return { id: `${resolution.id}-ERROR`, meta: { errorMessage } }
          }
        }

        return resolution?.id
      }

      return null
    },
    async load (id) {
      if (id.endsWith('-ERROR')) {
        const moduleInfo = this.getModuleInfo(id)

        return `throw new Error(\`${moduleInfo?.meta.errorMessage}\`)`
      }

      return null
    },
  }
}
