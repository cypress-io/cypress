const { getAccessibilityResults } = require('@cypress/extract-cloud-results')

/**
 * The list of rules that currently have 1+ elements that have been flagged with
 * violations within the Cypress Accessibility report that need to be addressed.
 *
 * For example, the `aria-required-children` rule can have multiple
 * elements that caused this rule to fail.
 *
 * Once the violation is fixed in the Cypress App's Accessibility report,
 * the fixed rule should be removed from this list.
 *
 * View the Accessibility report for the Cypress run in the Cloud
 * for more details on how to address these failures.
 */
const rulesWithExistingViolations = [
  'aria-required-children',
  'aria-required-parent',
  'image-alt',
  'aria-allowed-role',
  'empty-heading',
  'heading-order',
  'page-has-heading-one',
  'aria-dialog-name',
  'aria-hidden-focus',
  'color-contrast',
  'link-in-text-block',
  'list',
  'listitem',
  'nested-interactive',
  'scrollable-region-focusable',
]

// This polls up to 30 times every 30 seconds.
// This resolves when the Accessibility report is ready for the Cypress run.
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

  const newRuleViolations = rules.filter((rule) => !rulesWithExistingViolations.includes(rule.name))

  if (newRuleViolations.length > 0) {
    console.error('The following rules were violated that were previously passing:')
    console.error(newRuleViolations)

    throw new Error(`${newRuleViolations.length} rule regressions were introduced and must be fixed.`)
  }

  if (total < rulesWithExistingViolations.length) {
    console.warn(`It seems you have resolved ${rulesWithExistingViolations.length - total} rule(s). Remove them from the list of problematic rules so regressions are not introduced.`)
  }

  console.log('No new Accessibility violations detected!')
})
.catch((error) => {
  // We often get errors on reruns of failed tests because Cypress cannot generate a report
  // where multiple runs are found. We'll ignore this until this is addressed within Cypress
  // so as not to fail the build and affect our success rates.
  console.log('Error occurred while processing the Accessibility report. This error will be ignored:')
  console.log(error)

  process.exit(0)
})
