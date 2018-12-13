const { oneLine } = require('common-tags')

module.exports = {
  partial ({ domainName }) {
    return oneLine`
      <script type='text/javascript'>
        document.domain = '${domainName}';
      </script>
    `
  },

  full ({ domainName, url, headers, statusCode }) {
    return oneLine`
      <script type='text/javascript'>
        document.domain = '${domainName}';

        var Cypress = window.Cypress = parent.Cypress;

        if (!Cypress) {
          throw new Error('Something went terribly wrong and we cannot proceed. We expected to find the global Cypress in the parent window but it is missing!. This should never happen and likely is a bug. Please open an issue!');
        };

        Cypress.action('app:page:start', { win: window, url: '${url}', statusCode: ${statusCode}, headers: ${JSON.stringify(headers)} });
      </script>
    `
  },
}
