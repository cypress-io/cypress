const parser = require('conventional-commits-parser').sync;

const changeCatagories = {
  breaking: {
    description: 'A breaking change that will require a MVB',
    title: '**Breaking Changes:**',
    message: changeLinkPhrases.default,
  },
  dependency: {
    description: 'A change to a dependency that impact the user',
    title: '**Dependency Updates:**',
    message: changeLinkPhrases.default,
  },
  deprecation: {
    description: 'A API deprecation notice for users',
    title: '**Deprecations:**',
    message: changeLinkPhrases.default,
  },
  feat: {
    description: 'A new feature',
    title: '**Features:**',
    message: changeLinkPhrases.default,
  },
  fix: {
    description: 'A bug or regression fix',
    title: '**Bugfixes:**',
    message: changeLinkPhrases.fix,
  },
  misc: {
    description: ' misc user-facing change, like a UI update, which is not a fix or enhancement to how Cypress works',
    title: '**Misc:**',
    message: changeLinkPhrases.default,
  },
  perf: {
    description: 'A code change that improves performance',
    title: '**Performance:**',
    message: changeLinkPhrases.fix,
  },
}

const types = Object.keys(changeCatagories)

const parserOpts = {
  headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*)$/,
  breakingHeaderPattern: /^(\w*)(?:\((.*)\))?!: (.*)$/,
  headerCorrespondence: [
    'type',
    'scope',
    'subject'
  ],
  noteKeywords: ['BREAKING CHANGE', 'BREAKING-CHANGE'],
  revertPattern: /^(?:Revert|revert:)\s"?([\s\S]+?)"?\s*This reverts commit (\w*)\./i,
  revertCorrespondence: ['header', 'hash'],
  issuePrefixes: ['#']
}

module.exports = async function validatePrTitle(prTitle) {

  const result = parser(prTitle, parserOpts)

  function printAvailableTypes() {
    return `Available types:\n${types
      .map((type) => ` - ${type}: ${changeCatagories[type].description}`)
      .join('\n')}`;
  }

  if (!result.type) {
    throw new Error(
      `No release type found in pull request title "${prTitle}". Add a prefix to indicate what kind of release this pull request corresponds to. Cypress types are:/\n\n${printAvailableTypes()}`
    );
  }

  if (!result.subject) {
    throw new Error(`No subject found in pull request title "${prTitle}".`);
  }

  if (!types.includes(result.type)) {
    throw new Error(
      `Unknown release type "${result.type}" found in pull request title "${prTitle}".
      \n\n${printAvailableTypes()}`
    );
  }
};
