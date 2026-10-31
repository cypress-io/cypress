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
    // A dry run never publishes, so it skips the npm auth check and needs no NPM_TOKEN
    ['@semantic-release/npm', { npmPublish: !process.env.SEMANTIC_RELEASE_SKIP_NPM_PUBLISH }],
  ],
  extends: 'semantic-release-monorepo',
  branches: [
    { name: 'develop', channel: 'latest' },
  ],
}
