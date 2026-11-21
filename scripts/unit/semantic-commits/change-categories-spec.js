const { expect } = require('chai')

const { parserOpts } = require('../../semantic-commits/change-categories')
const messages = require('../__fixtures__/revert-commit-messages')
const { _validateTitle } = require('../../github-actions/semantic-pull-request/validate-pr-title')

const SLOW_MS = 200

describe('semantic-commits/change-categories parserOpts', () => {
  context('headerPattern', () => {
    const header = (title) => {
      const match = title.match(parserOpts.headerPattern)

      return match && match.slice(1)
    }

    ;[
      // Real titles from develop.
      ['fix: apply the browser\'s rules to document.cookie writes in cy.origin() (#35294)', ['fix', undefined, 'apply the browser\'s rules to document.cookie writes in cy.origin() (#35294)']],
      ['chore(deps): update dependency vite to v8.1.5 (#35210)', ['chore', 'deps', 'update dependency vite to v8.1.5 (#35210)']],
      ['feat(cy.prompt): add support for custom selectors (#34981)', ['feat', 'cy.prompt', 'add support for custom selectors (#34981)']],
      ['revert: "fix: truncate long strings in chai inspect (#33512)" (#33611)', ['revert', undefined, '"fix: truncate long strings in chai inspect (#33512)" (#33611)']],
      // Edge cases.
      ['fix(a(b)): nested parens', ['fix', 'a(b)', 'nested parens']],
      ['fix(server): handle foo(): bar', ['fix', 'server): handle foo(', 'bar']],
      ['fix: ', ['fix', undefined, '']],
      [': no type', ['', undefined, 'no type']],
      ['fix:missing space', null],
      ['Update README.md', null],
      ['', null],
    ].forEach(([title, expected]) => {
      it(`parses ${JSON.stringify(title)}`, () => {
        expect(header(title)).to.deep.equal(expected)
      })
    })

    it('reads a subject up to a stray carriage return instead of rejecting the header', () => {
      expect(header('fix: subject\rtrailer')).to.deep.equal(['fix', undefined, 'subject'])
    })

    it('lets the PR title check read a real title', () => {
      expect(() => _validateTitle('chore(deps): update dependency vite to v8.1.5 (#35210)')).not.to.throw()
    })

    it('parses a 50,000-character scope of "): " ending in a carriage return in linear time', () => {
      const title = `fix(${'): '.repeat(16_666)}\r`
      const start = performance.now()

      expect(header(title)).to.deep.equal(['fix', '): '.repeat(16_665), ''])
      expect(performance.now() - start).to.be.lessThan(SLOW_MS)
    })
  })

  context('revertPattern', () => {
    const revert = (message) => {
      const match = message.match(parserOpts.revertPattern)

      return match && match.slice(1)
    }

    it('reads the header and hash of a GitHub revert', () => {
      expect(revert(messages.gitHubRevert)).to.deep.equal(['chore: updating v8 snapshot cache" (#30391)', '0916ab7eb7877f59992a3506c8b65b2b002502ee'])
      expect(revert(messages.gitHubRevertWithoutPR)).to.deep.equal(['remove instruction to update electron version in centos 7 step', '01131cfecaab41acdc6b678fddf39515c2301889'])
    })

    it('ignores reverts that are not at the start of the message', () => {
      expect(revert(messages.squashedGitHubRevert)).to.be.null
      expect(revert(messages.revertInSquashBodyCRLF)).to.be.null
      expect(revert(messages.squashedConventionalRevert)).to.be.null
    })

    ;[
      ['a quoted header', 'Revert "fix: a bug"\n\nThis reverts commit abc123.', ['fix: a bug', 'abc123']],
      ['an unquoted header', 'revert: fix: a bug This reverts commit abc123.', ['fix: a bug', 'abc123']],
      ['a header that starts with whitespace', 'Revert   fix\nThis reverts commit abc123.', ['  fix', 'abc123']],
      ['a whitespace-only header', 'Revert   This reverts commit abc123.', [' ', 'abc123']],
      ['a single-character header', 'Revert x This reverts commit abc123.', ['x', 'abc123']],
      ['a quote after whitespace', 'Revert "a \t"This reverts commit abc123.', ['a \t', 'abc123']],
      ['an empty hash', 'Revert "a" This reverts commit .', ['a', '']],
      ['a missing period', 'Revert "a" This reverts commit abc123', null],
    ].forEach(([label, message, expected]) => {
      it(`parses ${label}`, () => {
        expect(revert(message)).to.deep.equal(expected)
      })
    })

    it('rejects 50,000 characters of whitespace without a trailer in linear time', () => {
      const message = `Revert "a${' \n'.repeat(25_000)}"`
      const start = performance.now()

      expect(revert(message)).to.be.null
      expect(performance.now() - start).to.be.lessThan(SLOW_MS)
    })
  })
})
