import type { Rule } from 'eslint'
import { builtinRules } from 'eslint/use-at-your-own-risk'

const arrowBodyStyle = builtinRules.get('arrow-body-style') as Rule.RuleModule

// `//---` above a report opts that arrow out, matching the token pattern the
// rule has honored since it lived in @cypress/eslint-plugin-dev.
const optOutComment = /^-{2,}$/u

/**
 * `arrow-body-style` has no multiline-only mode, so wrap it and drop reports on
 * arrows that already fit on a single line.
 *
 * The upstream rule is reached through `builtinRules` because `Linter#getRules()`,
 * which the original implementation used, throws under flat config.
 */
export const arrowBodyMultilineBraces: Rule.RuleModule = {
  meta: {
    ...arrowBodyStyle.meta,
    docs: {
      description: 'Enforce braces in arrow function bodies only when the arrow spans multiple lines',
    },
  },
  create (context) {
    const filteringContext = Object.create(context, {
      report: {
        value (descriptor: Rule.ReportDescriptor) {
          const node = (descriptor as { node?: Rule.Node }).node

          if (node && node.loc && node.loc.start.line === node.loc.end.line) {
            return
          }

          const loc = (descriptor as { loc?: { start: { line: number, column: number } } }).loc ?? node?.loc

          if (loc) {
            const index = context.sourceCode.getIndexFromLoc(loc.start)
            const token = context.sourceCode.getTokenByRangeStart(index, { includeComments: true })

            if (token && token.type === 'Line' && optOutComment.test(token.value)) {
              return
            }
          }

          context.report(descriptor)
        },
      },
    })

    return arrowBodyStyle.create(filteringContext)
  },
}
