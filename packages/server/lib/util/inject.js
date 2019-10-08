const { oneLine } = require('common-tags')

module.exports = {
  partial (domain) {
    return oneLine`
      <script type='text/javascript'>
        document.domain = '${domain}';
      </script>
    `
  },

  full (domain) {
    return oneLine`
      <script type='text/javascript'>
        document.domain = '${domain}';

        var Cypress = window.Cypress = parent.Cypress;

        if (!Cypress) {
          throw new Error('Something went terribly wrong and we cannot proceed. We expected to find the global Cypress in the parent window but it is missing!. This should never happen and likely is a bug. Please open an issue!');
        };

        Cypress.action('app:window:before:load', window);
      </script>
    `
  },
}
