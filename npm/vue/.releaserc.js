module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    { name: 'next/npm/vue2' },
    { name: 'master', channel: 'next', prerelease: 'beta' },
  ],
}
