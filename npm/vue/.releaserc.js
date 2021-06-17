module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    'npm/vue/v2',
    { name: 'master', channel: 'next', prerelease: 'beta' },
  ],
}
