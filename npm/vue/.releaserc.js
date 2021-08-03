module.exports = {
  ...require('../../.releaserc.base'),
  branches: [
    // we need to keep this branch in here even if no used because semantic-release demands
    // that we have at least one branch that has no config
    'next/npm/vue',
    // this line forces releasing 2.X releases on the latest channel
    { name: 'npm/vue/v2', range: '2.X.X' },
    // this one releases v3 on master as beta on the next channel
    { name: 'master', channel: 'next' },
  ],
}
