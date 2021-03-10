module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    { name: 'master' },
    { name: 'next/npm/react', channel: 'next', prerelease: 'alpha' },
  ],
}
