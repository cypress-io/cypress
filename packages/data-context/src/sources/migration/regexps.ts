/**
 * matches
 * - file.spec.tsx
 * - file.Test.tsx
 * - file_Spec.js
 * - file-spec.js
 *
 * but also matches
 *  file.cy.jsx
 */
const specExtRe = '(?<!\/)([._-][t|T]est[.]|[._-]?[s|S]pec[.]|[.]cy[.]|[.])(?=[j|t]s[x]?)'

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
