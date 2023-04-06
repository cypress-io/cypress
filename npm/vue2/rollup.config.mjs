import { createEntries } from '@cypress/mount-utils/create-rollup-entry.mjs'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'

const config = {
  external: [
    'vue',
  ],
  plugins: [
    json(),
    /**
       * Vue 2 core tries to load require.resolve(`./package.json`) in the browser for the
       * sole purpose of throwing an error about Vue Loader.
       * Just truncate this for now for simplicity.
       */
    replace({
      'vueVersion && vueVersion !== packageVersion': JSON.stringify(false),
      preventAssignment: false,
    }),
  ],
  output: {
    globals: {
      vue: 'Vue',
    },
  },
}

export default createEntries({ formats: ['es', 'cjs'], input: 'src/index.ts', config })
