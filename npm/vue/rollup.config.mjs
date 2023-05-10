import { createEntries } from '@cypress/mount-utils/create-rollup-entry.mjs'

const config = {
  external: [
    'vue',
    '@vue/compiler-dom',
    '@vue/server-renderer'
  ],
  output: {
    globals: {
      vue: 'Vue',
      vue: 'Vue',
      '@vue/compiler-dom': 'VueCompilerDOM',
      '@vue/server-renderer': 'VueServerRenderer'
    },
  },
}

export default createEntries({ formats: ['es', 'cjs'], input: 'src/index.ts', config })
