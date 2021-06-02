module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    { name: 'npm/vue/v2', range: '2.x' },
    { name: 'master', channel: 'next', prerelease: 'beta' },
  ],
}
