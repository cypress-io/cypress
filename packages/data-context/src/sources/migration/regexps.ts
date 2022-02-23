/**
 * This partial regular expression is used to extract
 * the extension from a spec file name:
 *
 * matches
 * - file.spec.tsx -> ext=".spec."
 * - file_Spec.js -> ext="_Spec."
 * - file-spec.js -> ext="-spec."
 * - spec.js -> ext="."
 *
 * The final objective being to be able to replace it with ".cy."
 */
const specExtRe = '(?<!\/)[._-]?[s|S]pec.|[.])(?=([j|t]s[x]|coffee)?'

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
    beforeRegexp: 'cypress[\\\\/]support[\\\\/](?<name>index)\.(?=(?:[j|t]sx?|coffee))',
    afterRegexp: 'cypress[\\\\/]support[\\\\/](?<name>e2e)\.(?=(?:[j|t]sx?|coffee))',
  },
} as const
