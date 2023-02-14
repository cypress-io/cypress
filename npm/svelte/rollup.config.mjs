import { createEntries } from '@cypress/mount-utils/create-rollup-entry.mjs'

export default createEntries({ formats: ['es', 'cjs'], input: 'src/index.ts' })
