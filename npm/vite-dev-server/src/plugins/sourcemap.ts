import debugFn from 'debug'
import type { Plugin } from 'vite'
import type { Vite } from '../getVite'

import type { ViteDevServerConfig } from '../devServer'

const debug = debugFn('cypress:vite-dev-server:plugins:sourcemap')

export const CypressSourcemap = (
  options: ViteDevServerConfig,
  vite: Vite,
): Plugin => {
  return {
    name: 'cypress:sourcemap',
    enforce: 'post',
    transform (code, id, options?) {
      try {
        if (/\.js$/i.test(id) && !/\/\/# sourceMappingURL=/i.test(code)) {
          /*
          The Vite dev server and plugins automatically generate sourcemaps for most files, but they are
          only included in the served files if any transpilation actually occurred (JSX, TS, etc). This
          means that files that are "pure" JS won't include sourcemaps, so JS spec files that don't require
          transpilation won't get code frames in the runner.

          A sourcemap for these files is generated (just not served) which is in effect an "identity"
          sourcemap mapping 1-to-1 to the output file. We can grab this and pass it along as a sourcemap
          we want Vite to embed into the output, giving Cypress a sourcemap to use for codeFrame lookups.
          @see https://rollupjs.org/guide/en/#thisgetcombinedsourcemap

          We utilize a 'post' plugin here and manually append the sourcemap content to the code. We *should*
          be able to pass the sourcemap along using the `map` attribute in the return value, but Babel-based
          plugins don't work with this which causes sourcemaps to break for files that go through common
          plugins like `@vitejs/plugin-react`. By manually appending the sourcemap at this point in time
          Babel-transformed files end up with correct sourcemaps.
          */

          const sourcemap = this.getCombinedSourcemap()

          code += `\n//# sourceMappingURL=${sourcemap.toUrl()}`

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
