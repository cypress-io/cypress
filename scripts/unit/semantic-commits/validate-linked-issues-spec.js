const { expect, use } = require('chai')
const sinonChai = require('sinon-chai')

const { getLinkedIssues } = require('../../semantic-commits/get-linked-issues')

use(sinonChai)

describe('semantic-commits/get-linked-issues', () => {
  it('returns single issue link', () => {
    const issues = getLinkedIssues(`
        <!-- comment -->
        - Closes #23
        summary of changes see in #458
      `)

    expect(issues).to.deep.eq(['23'])
  })

  it('returns issue links for all linking keywords', () => {
    const issues = getLinkedIssues(`
        <!-- comment -->
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
        <!-- comment -->
        summary of changes
      `)

    expect(issues).to.deep.eq([])
  })

  describe('HTML comments', () => {
    it('ignores a reference inside a single-line comment', () => {
      const issues = getLinkedIssues(`
        - Closes <!-- closes #31024 -->
      `)

      expect(issues).to.deep.eq([])
    })

    it('ignores references inside a multi-line comment', () => {
      const issues = getLinkedIssues(`
        <!-- Examples:
        - Closes #31025
        - Fixes cypress-io/cypress#31026
        - Resolves https://github.com/cypress-io/cypress/issues/31027
        -->
        summary of changes
      `)

      expect(issues).to.deep.eq([])
    })

    it('ignores a reference inside an unclosed comment at the end', () => {
      const issues = getLinkedIssues(`
        summary of changes
        <!-- fixes #31028
      `)

      expect(issues).to.deep.eq([])
    })

    it('keeps references before and after a comment', () => {
      const issues = getLinkedIssues(`
        - Closes #31029
        <!-- link to the issue here, if there is one -->
        - Fixes #31030
      `)

      expect(issues).to.deep.eq(['31029', '31030'])
    })

    it('keeps a reference between two comments', () => {
      const issues = getLinkedIssues(`
        <!-- closes #31031 -->
        - Closes #31032
        <!-- fixes #31033 -->
      `)

      expect(issues).to.deep.eq(['31032'])
    })
  })
})
