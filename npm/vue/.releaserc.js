module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    '@cypress/vue@1.0.0',
    { name: 'master', prerelease: 'alpha' },
  ],
}
