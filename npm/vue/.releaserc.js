module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    '@cypress/vue@1.0.0',
    { name: 'master', prerelease: 'alpha' },
    { name: 'vue-next', channel: 'next', prerelease: 'alpha' },
  ],
}
