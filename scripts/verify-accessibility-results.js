const { getAccessibilityResults } = require('@cypress/extract-cloud-results')

/**
 * The current list of passing rules used to ensure
 * regressions / violations to previously passing rules
 * are not introduced.
 */
const rulesThatMustPass = [
  'meta-refresh', // ignored by config
  // 'no-autoplay-audio', // ignored by config
  'area-alt',
  'aria-allowed-attr',
  'aria-hidden-body',
  'aria-required-attr',
  // 'aria-required-children',
  // 'aria-required-parent',
  'aria-roles',
  'aria-valid-attr',
  // 'aria-valid-attr-value',
  // 'button-name',
  // 'duplicate-id-aria',
  'frame-tested',
  // 'image-alt',
  'input-button-name',
  'input-image-alt',
  // 'label',
  'meta-viewport',
  'select-name',
  'video-caption',
  // 'aria-allowed-role',
  'aria-deprecated-role',
  // 'empty-heading',
  'empty-table-header',
  'image-redundant-alt',
  'meta-viewport-large',
  'presentation-role-conflict',
  'server-side-image-map',
  'table-duplicate-name',
  'form-field-multiple-labels',
  // 'heading-order',
  'html-xml-lang-mismatch',
  'landmark-banner-is-top-level',
  'landmark-complementary-is-top-level',
  'landmark-contentinfo-is-top-level',
  'landmark-main-is-top-level',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-contentinfo',
  'landmark-no-duplicate-main',
  'landmark-one-main',
  'landmark-unique',
  // 'page-has-heading-one',
  'region',
  'scope-attr-valid',
  'skip-link',
  'accesskeys', // ignored by config
  'aria-braille-equivalent',
  'aria-command-name',
  'aria-conditional-attr',
  // 'aria-dialog-name',
  // 'aria-hidden-focus',
  // 'aria-input-field-name',
  'aria-meter-name',
  'aria-progressbar-name',
  // 'aria-prohibited-attr',
  'aria-text',
  // 'aria-toggle-field-name',
  'aria-tooltip-name',
  'aria-treeitem-name',
  'autocomplete-valid', // ignored by config
  'avoid-inline-spacing', // ignored by config
  'blink',
  'bypass',
  // 'color-contrast',
  'definition-list',
  'dlitem',
  'document-title',
  'frame-focusable-content',
  'frame-title',
  'frame-title-unique',
  'html-has-lang',
  'html-lang-valid',
  'label-title-only',
  // 'link-in-text-block',
  'link-name',
  // 'list',
  // 'listitem',
  'marquee',
  // 'nested-interactive',
  'object-alt',
  'role-img-alt',
  // 'scrollable-region-focusable',
  'svg-img-alt',
  'tabindex',
  'td-headers-attr',
  'th-has-data-cells',
  'valid-lang',
  'audio-caption',
  'aria-roledescription',
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
  if (total > 0) {
    const { critical, serious, moderate, minor } = summary.violationCounts

    console.log(`${total} Accessibility violations were detected - ${critical} critical, ${serious} serious, ${moderate} moderate, and ${minor} minor.`)
    console.log('The following rules were violated:')

    const rulesPrevPassing = rules.filter((rule) => rulesThatMustPass.includes(rule.name))

    if (rulesPrevPassing.length === 0) {
      console.log('No new Accessibility violations detected!')

      return
    }

    console.log('The following rules were violated that were previously passing:')
    console.log(rulesPrevPassing)

    throw new Error(
      `${rulesPrevPassing.length} Accessibility violations detected and must be fixed.`,
    )
  }

  console.log('No Accessibility violations detected!')
})
