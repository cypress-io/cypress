import type { ESLint } from 'eslint'

import { arrowBodyMultilineBraces } from './arrowBodyMultilineBraces'
import { skipComment } from './skipComment'

// Namespaced `@cypress/dev` so existing `eslint-disable @cypress/dev/...`
// comments resolve.
export const cypressDevPlugin: ESLint.Plugin = {
  rules: {
    'arrow-body-multiline-braces': arrowBodyMultilineBraces,
    'skip-comment': skipComment,
  },
}
