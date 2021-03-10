module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    'master',
    { name: 'next/npm/react', channel: 'next', prerelease: 'alpha' },
  ],
}
