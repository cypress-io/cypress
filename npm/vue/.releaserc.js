module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    { name: 'npm/vue/v2' },
    { name: 'master', channel: 'next', prerelease: 'beta' },
  ],
}
