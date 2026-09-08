import type { Rule, SourceCode } from 'eslint'

const ruleComposer = require('eslint-rule-composer')
const { Linter } = require('eslint') as typeof import('eslint')

type SourceLocation = NonNullable<Rule.Node['loc']>

// `eslint-rule-composer` ships no types. `filterReports` hands its predicate the
// problem the wrapped rule reported, plus the context it was reported from.
interface Problem {
  node: Rule.Node & { loc: SourceLocation }
  loc: SourceLocation
}

interface ProblemMetadata {
  sourceCode: SourceCode
}

const arrowBodyStyle = new Linter().getRules().get('arrow-body-style')

const rule: Rule.RuleModule = ruleComposer.filterReports(
  arrowBodyStyle,
  (problem: Problem, metadata: ProblemMetadata) => {
    const problemIndex = metadata.sourceCode.getIndexFromLoc(problem.loc.start)
    const reportedToken = metadata.sourceCode.getTokenByRangeStart(problemIndex, { includeComments: true })

    if (problem.node.loc.start.line === problem.node.loc.end.line) {
      return
    }

    return !(reportedToken && reportedToken.type === 'Line' && /^-{2,}$/u.test(reportedToken.value))
  },
)

module.exports = rule
