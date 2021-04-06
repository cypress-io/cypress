/**
 * NOTICE
 * Disable the release for React until further notice.
 * You may re-enable it by toggling publishConfig: restricted/public
 * and uncommenting the following lines
 */
module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    { name: 'master', channel: 'latest' },
  ],
}
