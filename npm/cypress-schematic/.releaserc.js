module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    { name: 'next/npm/cypress-schematic', channel: 'next', prerelease: 'alpha' },
  ],
}
