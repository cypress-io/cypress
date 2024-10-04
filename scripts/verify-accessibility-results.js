const { getAccessibilityResults } = require('@cypress/extract-cloud-results')

/**
 * The current problematic rules that need to be addressed.
 */
const problematicRules = [
  'aria-required-children',
  'aria-required-parent',
  'button-name',
  'image-alt',
  'label',
  'aria-allowed-role',
  'empty-heading',
  'heading-order',
  'page-has-heading-one',
  'aria-dialog-name',
  'aria-hidden-focus',
  'aria-input-field-name',
  'aria-toggle-field-name',
  'color-contrast',
  'link-in-text-block',
  'list',
  'listitem',
  'nested-interactive',
  'scrollable-region-focusable',
]

getAccessibilityResults({
  projectId: 'ypt4pf',
})
.then((results) => {
  const {
    runNumber,
    accessibilityReportUrl,
    summary,
    rules,
  } = results
  const { total } = summary.violationCounts

  console.log(`Received ${summary.isPartialReport ? 'partial' : ''} results for run #${runNumber}.`)
  console.log(`See full report at ${accessibilityReportUrl}.`)

  // write your logic to conditionally fail based on the results
  if (total === 0) {
    console.log('No Accessibility violations detected!')

    return
  }

  const { critical, serious, moderate, minor } = summary.violationCounts

  console.log(`${total} Accessibility violations were detected - ${critical} critical, ${serious} serious, ${moderate} moderate, and ${minor} minor.`)

  const newRuleViolations = rules.filter((rule) => !problematicRules.includes(rule.name))

  if (newRuleViolations.length > 0) {
    console.log('The following rules were violated that were previously passing:')
    console.log(newRuleViolations)

    throw new Error(`${newRuleViolations.length} rule regressions were introduced and must be fixed.`)
  }

  if (total < problematicRules.length) {
    console.warn(`It seems you have resolved ${problematicRules.length - total} rule(s). Remove them from the list of problematic rules so regressions are not introduced.`)
  }

  console.log('No new Accessibility violations detected!')
})
