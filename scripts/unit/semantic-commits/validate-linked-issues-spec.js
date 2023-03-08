const { expect, use } = require('chai')
const sinonChai = require('sinon-chai')

const { getLinkedIssues } = require('../../semantic-commits/get-linked-issues')

use(sinonChai)

describe('semantic-commits/get-linked-issues', () => {
  it('returns single issue link', () => {
    const issues = getLinkedIssues(`
        <!-- comment ->
        - Closes #23
        summary of changes see in #458
      `)

    expect(issues).to.deep.eq(['23'])
  })

  it('returns issue links for all linking keywords', () => {
    const issues = getLinkedIssues(`
        <!-- comment ->
        - Close #23
        - Closes #24
        - Closed #25
        - fix cypress-io/cypress#33, fixed cypress-io/cypress#34
        - fixes cypress-io/cypress#35
        - resolves #44
        - Resolved #45
        - Resolves #46
        - addresses #77 <-- not a valid linking word
        summary of changes
        - Closes https://github.com/cypress-io/cypress/issues/50
      `)

    expect(issues).to.deep.eq(['23', '24', '25', '33', '34', '35', '44', '45', '46', '50'])
  })

  it('only counts an issue once', () => {
    const body = `
        - closes #44
        - closes #44
      `
    const issues = getLinkedIssues(body)

    expect(issues).to.deep.eq(['44'])
  })

  it('does not return non-local issue numbers', () => {
    const body = `
        fixes cypress-io/cypress#123 which is a local issue
        and this is issue in another repo foo/bar#101
      `
    const issues = getLinkedIssues(body)

    expect(issues).to.deep.eq(['123'])
  })

  it('returns empty list when no issues found', () => {
    const issues = getLinkedIssues(`
        <!-- comment ->
        summary of changes
      `)

    expect(issues).to.deep.eq([])
  })
})
