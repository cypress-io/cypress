import { createEntries } from '@cypress/mount-utils/create-rollup-entry.mjs'

const config = {
  external: [
    'vue',
  ],
  output: {
    globals: {
      vue: 'Vue',
    },
  },
}

export default createEntries({ formats: ['es', 'cjs'], input: 'src/index.ts', config })
