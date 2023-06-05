const { expect } = require('chai')
const sinon = require('sinon')
const { validatePrTitle, _validateTitle } = require('../../../github-actions/semantic-pull-request/validate-pr-title')

describe('semantic-pull-request/validate-pr-title', () => {
  context('validatePrTitle', () => {
    const restParameters = {
      owner: 'cypress-io',
      repo: 'cypress',
      pull_number: 52,
    }

    describe('more than one commit', () => {
      it('only validates pr title', async () => {
        const commits = [
          { parents: ['dev'] },
          { parents: ['dev'] },
        ]

        const myAsyncIterable = {
          async *[Symbol.asyncIterator] () {
            yield { data: commits }
          },
        }

        const github = {
          paginate: {
            iterator: sinon.stub().returns(myAsyncIterable),
          },
          rest: {
            pulls: {},
          },
        }

        const prTitle = 'fix: issue with server'
        const semanticResult = await validatePrTitle({
          github,
          prTitle,
          restParameters,
        })

        expect(semanticResult.type).to.eq('fix')
      })
    })

    describe('one commit', () => {
      it('only validates pr title and commit message', async () => {
        const commits = [
          { parents: ['dev'], commit: { message: 'fix: issue with server and add test' } },
        ]

        const myAsyncIterable = {
          async *[Symbol.asyncIterator] () {
            yield { data: commits }
          },
        }

        const github = {
          paginate: {
            iterator: sinon.stub().returns(myAsyncIterable),
          },
          rest: {
            pulls: {},
          },
        }

        const prTitle = 'fix: issue with server'

        const semanticResult = await validatePrTitle({
          github,
          prTitle,
          restParameters,
        })

        expect(semanticResult.type).to.eq('fix')
      })

      it('throws when commit message does not follow semantics', async () => {
        const commits = [
          { parents: ['dev'], commit: { message: 'fix issue with server and add test' } },
        ]
        const myAsyncIterable = {
          async *[Symbol.asyncIterator] () {
            yield { data: commits }
          },
        }

        const github = {
          paginate: {
            iterator: sinon.stub().returns(myAsyncIterable),
          },
          rest: {
            pulls: {},
          },
        }

        const prTitle = 'fix: issue with server'

        return validatePrTitle({
          github,
          prTitle,
          restParameters,
        }).catch((err) => {
          expect(err.message).to.include('Pull request has only one commit and it\'s not semantic')
        })
      })
    })
  })

  context('_validateTitle', () => {
    it('allows valid PR titles', () => {
      [
        {
          type: 'breaking',
          title: 'breaking: change behavior',
        },
        {
          type: 'fix',
          title: 'fix: Fix bug',
        },
        {
          type: 'perf',
          title: 'perf: make things faster',
        },
        {
          type: 'chore',
          title: 'chore: do something',
        },
        {
          type: 'refactor',
          title: 'refactor: Internal cleanup',
        },
      ].forEach(({ title, type }) => {
        expect(_validateTitle(title)).to.contain({ type })
      })
    })

    it('throws for PR titles without a type', () => {
      expect(() => _validateTitle('Fix bug')).to.throw(
        'No release type found in pull request title "Fix bug". Add a prefix to indicate what kind of release this pull request corresponds to.',
      )
    })

    it('throws for PR titles with only a type', () => {
      expect(() => _validateTitle('fix:')).to.throw(
        'No release type found in pull request title "fix:".',
      )
    })

    it('throws for PR titles without a subject', () => {
      expect(() => _validateTitle('fix: ')).to.throw(
        'No subject found in pull request title "fix: ".',
      )
    })

    it('throws for PR titles with an unknown type', () => {
      expect(() => _validateTitle('foo: Bar')).to.throw(
        'Unknown release type "foo" found in pull request title "foo: Bar".',
      )
    })

    describe('defined scopes', () => {
      it('allows a missing scope by default', () => {
        _validateTitle('fix: Bar')
      })

      it('allows all scopes by default', () => {
        _validateTitle('fix(core): Bar')
      })
    })
  })
})
