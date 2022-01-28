const specExtRe = '[._-]?[s|S]pec.|[.])(?=[j|t]s[x]?'

export const regexps = {
  e2e: {
    before: {
      defaultFolderDefaultTestFiles: `cypress\/(?<main>integration)\/.*?(?<ext>${specExtRe})`,
      defaultFolderCustomTestFiles: /cypress\/(?<main>integration)\/.*/,
      customFolderDefaultTestFiles: `.*?(?<ext>${specExtRe})`,
    },
  },
  component: {
    before: {
      defaultFolderDefaultTestFiles: `cypress\/component\/.*?(?<ext>${specExtRe})`,
      customFolderDefaultTestFiles: `.*?(?<ext>${specExtRe})`,
    },
  },
} as const
