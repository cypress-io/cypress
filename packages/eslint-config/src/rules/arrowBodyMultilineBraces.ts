import type { Rule } from 'eslint'
import { builtinRules } from 'eslint/use-at-your-own-risk'

const arrowBodyStyle = builtinRules.get('arrow-body-style') as Rule.RuleModule

// `fixable` is dropped along with the fixes themselves — see the note on `create`.
const { fixable: _fixable, ...arrowBodyStyleMeta } = arrowBodyStyle.meta ?? {}

/**
 * `arrow-body-style` has no multiline-only mode, so wrap it and drop reports on
 * arrows that already fit on a single line.
 *
 * The upstream rule is reached through `builtinRules` because `Linter#getRules()`,
 * which the original implementation used, throws under flat config.
 */
export const arrowBodyMultilineBraces: Rule.RuleModule = {
  meta: {
    ...arrowBodyStyleMeta,
    docs: {
      description: 'Enforce braces in arrow function bodies only when the arrow spans multiple lines',
    },
  },
  create (context) {
    const filteringContext = Object.create(context, {
      report: {
        // The upstream fixer inserts `{ return … }` without reindenting, and
        // `@stylistic/indent` is off in this config, so nothing tidies up after
        // it — an autofix lands the body at column 0. Severity is no protection
        // either: `--fix` rewrites warnings too, and lint-staged runs it on every
        // staged file. So the fix is dropped and the author reindents by hand.
        value ({ fix, ...descriptor }: Rule.ReportDescriptor) {
          const node = (descriptor as { node?: Rule.Node }).node

          if (node?.loc && node.loc.start.line === node.loc.end.line) {
            return
          }

          context.report(descriptor as Rule.ReportDescriptor)
        },
      },
    })

    return arrowBodyStyle.create(filteringContext)
  },
}
