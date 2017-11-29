// Default plugins that we'll wrap to filter commits by package.
const commitAnalyzer = require('@semantic-release/commit-analyzer');
const releaseNotesGenerator = require('@semantic-release/release-notes-generator');

const overrideOption = (key, wrapperFn) => pluginFn => async (pluginConfig, options) => {
  const overriddenValue = await wrapperFn(options[key]);
  return pluginFn(pluginConfig, { ...options, [key]: overriddenValue });
};

const withPackageCommits = overrideOption('commits', require('./src/with-package-commits'));
const publish = require('./src/publish');

module.exports = {
  analyzeCommits: withPackageCommits(commitAnalyzer),
  generateNotes: withPackageCommits(releaseNotesGenerator),
  publish,
};
