const ruleComposer = require('eslint-rule-composer')
const arrowBodyStyle = require('eslint/lib/rules/arrow-body-style')

module.exports = ruleComposer.filterReports(
  arrowBodyStyle,
  (problem, metadata) => {
    const problemIndex = metadata.sourceCode.getIndexFromLoc(problem.loc.start)
    const reportedToken = metadata.sourceCode.getTokenByRangeStart(problemIndex, { includeComments: true })

    if (problem.node.loc.start.line === problem.node.loc.end.line) {
      return
    }

    return !(reportedToken && reportedToken.type === 'Line' && /^-{2,}$/u.test(reportedToken.value))
  },
)
