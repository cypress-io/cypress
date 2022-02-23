/**
 * matches
 * - file.spec.tsx
 * - file.Test.tsx
 * - file_Spec.js
 * - file-spec.js
 */
const specExtRe = '(?<!\/)[._-]?(?:[s|S]pec|[t|T]est)?[.])(?=[j|t]s[x]?'

export const regexps = {
  e2e: {
    before: {
      defaultFolderDefaultTestFiles: `cypress\/(?<main>integration)\/.*?(?<ext>${specExtRe})`,
      defaultFolderCustomTestFiles: `cypress\/(?<main>integration)\/.*`,
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

export const supportFileRegexps = {
  e2e: {
    beforeRegexp: 'cypress[\\\\/]support[\\\\/](?<name>index)\.(?=[j|t]sx?)',
    afterRegexp: 'cypress[\\\\/]support[\\\\/](?<name>e2e)\.(?=[j|t]sx?)',
  },
} as const
