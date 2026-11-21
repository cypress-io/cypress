const changeLinkPhrases = {
  default: {
    hasIssue: 'Addresses',
    onlyPR: 'Addressed in',
  },
  fix: {
    hasIssue: 'Fixes',
    onlyPR: 'Fixed in',
  },
}

const userFacingChanges = {
  breaking: {
    description: 'A breaking change that will require a MVB',
    section: '**Breaking Changes:**',
    message: changeLinkPhrases.default,
    breaking: true,
    release: 'major',
  },
  dependency: {
    description: 'A change to a dependency that impacts the user',
    section: '**Dependency Updates:**',
    message: changeLinkPhrases.default,
    release: 'patch',
  },
  deprecation: {
    description: 'An API deprecation notice for users',
    section: '**Deprecations:**',
    message: changeLinkPhrases.default,
    release: 'minor',
  },
  feat: {
    description: 'A new feature',
    section: '**Features:**',
    message: changeLinkPhrases.default,
    release: 'minor',
  },
  fix: {
    description: 'A bug or regression fix',
    section: '**Bugfixes:**',
    message: changeLinkPhrases.fix,
    release: 'patch',
  },
  misc: {
    description: 'Misc user-facing changes, like a UI update, which is not a fix or enhancement to how Cypress works',
    section: '**Misc:**',
    message: changeLinkPhrases.default,
    release: 'patch',
  },
  perf: {
    description: 'Changes that improves performance',
    section: '**Performance:**',
    message: changeLinkPhrases.fix,
    release: 'patch',
  },
}

const changeCatagories = {
  ...userFacingChanges,
  chore: {
    description: 'Changes to the build process or auxiliary tools and libraries such as documentation generation',
    release: false,
  },
  docs: {
    description: 'Documentation only changes',
    release: false,
  },
  refactor: {
    description: 'A code change that neither fixes a bug nor adds a feature that is not user-facing',
    release: false,
  },
  revert: {
    description: 'Reverts a previous commit',
    release: false,
    revert: true,
  },
  test: {
    description: 'Adding missing or correcting existing tests',
    release: false,
  },
  internal: {
    description: 'Features or fixes available to internal Cypress users only',
    release: false,
  },
}

// Used by @semantic-release/commit-analyzer to determine next version for npm packages
const releaseRules = Object.entries(changeCatagories).map(([type, attrs]) => {
  return {
    type,
    breaking: attrs.breaking,
    release: attrs.release,
    revert: attrs.revert,
  }
})

// https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-angular/parser-opts.js
const parserOpts = {
  // `fix(server): handle foo` gives type `fix`, scope `server` and subject
  // `handle foo`. The parser hands over the header line alone, so the subject
  // runs to its end without a `$`, which would make a stray line terminator
  // retry the scope at every earlier `): `.
  headerPattern: /^(\w*)(?:\((.*)\))?: (.*)/,
  headerCorrespondence: [
    'type',
    'scope',
    'subject',
  ],
  noteKeywords: ['BREAKING CHANGE'],
  // `Revert "fix: foo (#123)"\n\nThis reverts commit abc123.` gives header
  // `fix: foo (#123)` and hash `abc123`. After its first character the header
  // takes each whitespace run whole, so the `\s*` that follows it isn't
  // rescanned from every position inside a long run.
  revertPattern: /^(?:Revert|revert:)\s"?([\s\S](?:\S|\s+(?!\s))*?)"?\s*This reverts commit (\w*)\./i,
  revertCorrespondence: ['header', 'hash'],
}

const migrationGuideBlurb = (version) => `Please read our Migration Guide which explains the changes in more detail and how to change your code to migrate to Cypress ${version}.`

module.exports = {
  changeCatagories,
  parserOpts,
  releaseRules,
  userFacingChanges,
  migrationGuideBlurb,
}
