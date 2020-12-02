module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
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
  ],
}
