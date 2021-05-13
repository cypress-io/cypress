module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    { name: 'master', channel: 'latest' },
    { name: 'next/npm/cypress-schematic', channel: 'next', prerelease: 'alpha' },
  ],
}
