module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    { name: 'master' },
    { name: 'next/npm/vue', channel: 'next', prerelease: 'alpha' },
  ],
}
