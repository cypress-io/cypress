import { createEntries } from '@cypress/mount-utils/create-rollup-entry.mjs'

const config = {
  external: [
    'react',
    'react-dom',
    'react-dom/client',
  ],
  output: {
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'react-dom/client': 'ReactDOM/client',
    },
  },
}

export default createEntries({ formats: ['es', 'cjs'], input: 'src/index.ts', config })
