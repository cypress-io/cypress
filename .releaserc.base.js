module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
  ],
  extends: 'semantic-release-monorepo',
  branches: [
  ],
}
