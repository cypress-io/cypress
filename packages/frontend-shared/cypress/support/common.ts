// Add cy.mount, cy.mountFragment, cy.mountFragmentList
export * from './mock-graphql/mountFragment'

import { initHighlighter } from '@cy/components/ShikiHighlight.vue'

// Make sure highlighter is initialized before
// we show any code to avoid jank at rendering
// @ts-ignore
await initHighlighter()
