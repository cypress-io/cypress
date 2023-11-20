const { parserOpts, releaseRules } = require('./scripts/semantic-commits/change-categories')

module.exports = {
  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'angular',
      parserOpts,
      releaseRules,
    }],
    ['@semantic-release/release-notes-generator',
      {
        preset: 'angular',
        parserOpts,
      }
    ],
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md',
    }],
    ['@semantic-release/git', {
      assets: [
        './CHANGELOG.md',
      ],
      message: 'chore: release ${nextRelease.gitTag}\n\n[skip ci]',
    }],
    '@semantic-release/npm',
  ],
  extends: 'semantic-release-monorepo',
  branches: [
    { name: 'develop', channel: 'latest' },
  ],
}
