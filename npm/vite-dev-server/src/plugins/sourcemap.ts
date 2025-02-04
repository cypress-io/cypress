import debugFn from 'debug'
import type { PluginOption } from 'vite-6'
import type { Vite } from '../getVite'

import type { ViteDevServerConfig } from '../devServer'

const debug = debugFn('cypress:vite-dev-server:plugins:sourcemap')

export const CypressSourcemap = (
  options: ViteDevServerConfig,
  vite: Vite,
): PluginOption => {
  return {
    name: 'cypress:sourcemap',
    enforce: 'post',
    transform (code, id, options?) {
      try {
        // Remove query parameters from the id. This is necessary because some files
        // have a cache buster query parameter (e.g. `?v=12345`)
        const queryParameterLessId = id.split('?')[0]

        // Check if the file has a JavaScript extension and does not have an inlined sourcemap
        if (/\.(js|jsx|ts|tsx|vue|svelte|mjs|cjs)$/i.test(queryParameterLessId) && !/\/\/# sourceMappingURL=data/i.test(code)) {
          /*
          The Vite dev server and plugins automatically generate sourcemaps for most files, but there are
          some files that don't have sourcemaps generated for them or are not inlined. We utilize a 'post' plugin
          here and manually append the sourcemap content to the code in these cases. We *should*
          be able to pass the sourcemap along using the `map` attribute in the return value, but Babel-based
          plugins don't work with this which causes sourcemaps to break for files that go through common
          plugins like `@vitejs/plugin-react`. By manually appending the sourcemap at this point in time
          Babel-transformed files end up with correct sourcemaps.
          */

          const sourcemap = this.getCombinedSourcemap()
          const sourcemapUrl = sourcemap.toUrl()

          if (/\/\/# sourceMappingURL=(?!['"])/i.test(code)) {
            // If the code already has a sourceMappingURL, it is not an inlined sourcemap
            // and we should replace it with the new sourcemap
            code = code.replace(/\/\/# sourceMappingURL=(?!['"])(.*)$/m, `//# sourceMappingURL=${sourcemapUrl}`)
          } else {
            // If the code does not have a sourceMappingURL, we should append the new sourcemap
            code += `\n//# sourceMappingURL=${sourcemapUrl}`
          }

          return {
            code,
            map: { mappings: '' },
          }
        }
      } catch (_err) {
        debug('Failed to propagate sourcemap for %s: %o', id, _err)
      }
    },
  }
}
