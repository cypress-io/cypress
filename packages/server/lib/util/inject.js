// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = {
  partial (domain) {
    return `\
<script type='text/javascript'> \
document.domain = '${domain}'; \
</script>\
`
  },

  full (domain) {
    return `\
<script type='text/javascript'> \
document.domain = '${domain}'; \
\
var Cypress = window.Cypress = parent.Cypress; \
\
if (!Cypress){ \
throw new Error('Something went terribly wrong and we cannot proceed. We expected to find the global Cypress in the parent window but it is missing!. This should never happen and likely is a bug. Please open an issue!'); \
}; \
\
Cypress.action('app:window:before:load', window); \
</script>\
`
  },

}
