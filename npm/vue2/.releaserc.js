module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    // this one releases v3 on master on the latest channel
    'master',
    // this line forces releasing 2.X releases on the v2 channel
    { name: 'npm/vue/v2', range: '2.X.X', channel: 'v2' },
  ],
}
