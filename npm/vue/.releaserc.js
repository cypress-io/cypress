module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    'next/npm/vue',
    { name: 'npm/vue/v2', range: '2.X.X' },
    { name: 'master', channel: 'next', prerelease: 'beta' },
  ],
}
