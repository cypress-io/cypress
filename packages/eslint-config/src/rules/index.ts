import type { ESLint } from 'eslint'

import { arrowBodyMultilineBraces } from './arrowBodyMultilineBraces'
import { skipComment } from './skipComment'

// Namespaced `@cypress/dev` to keep the existing `eslint-disable` comments
// working now that these rules no longer come from @cypress/eslint-plugin-dev.
export const cypressDevPlugin: ESLint.Plugin = {
  rules: {
    'arrow-body-multiline-braces': arrowBodyMultilineBraces,
    'skip-comment': skipComment,
  },
}
