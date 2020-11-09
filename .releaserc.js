module.exports = {
  ...require('./.releaserc.base'),
  branches: [
    'master',
    { name: 'chore/webpack-5', channel: 'channel-next' },
  ],
}
