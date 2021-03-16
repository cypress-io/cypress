module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    { name: '' }, // avoid releasing lastest channel until further notice
    { name: 'master', channel: 'next', prerelease: 'alpha' },
  ],
}
