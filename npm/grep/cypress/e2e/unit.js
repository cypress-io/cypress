/// <reference types="cypress" />

import {
  parseGrep,
  parseTitleGrep,
  parseFullTitleGrep,
  parseTagsGrep,
  shouldTestRun,
  shouldTestRunTags,
  shouldTestRunTitle,
} from '../../src/utils'

describe('utils', () => {
  context('parseTitleGrep', () => {
    it('grabs the positive title', () => {
      const parsed = parseTitleGrep('hello w')

      expect(parsed).to.deep.equal({
        title: 'hello w',
        invert: false,
      })
    })

    it('trims the string', () => {
      const parsed = parseTitleGrep('   hello w  ')

      expect(parsed).to.deep.equal({
        title: 'hello w',
        invert: false,
      })
    })

    it('inverts the string', () => {
      const parsed = parseTitleGrep('-hello w')

      expect(parsed).to.deep.equal({
        title: 'hello w',
        invert: true,
      })
    })

    it('trims the inverted the string', () => {
      const parsed = parseTitleGrep('  -hello w  ')

      expect(parsed).to.deep.equal({
        title: 'hello w',
        invert: true,
      })
    })

    it('returns null for undefined input', () => {
      const parsed = parseTitleGrep()

      expect(parsed).to.equal(null)
    })
  })

  context('parseFullTitleGrep', () => {
    it('returns list of title greps', () => {
      const parsed = parseFullTitleGrep('hello; one; -two')

      expect(parsed).to.deep.equal([
        { title: 'hello', invert: false },
        { title: 'one', invert: false },
        { title: 'two', invert: true },
      ])
    })
  })

  context('parseTagsGrep', () => {
    it('parses AND tags', () => {
      // run only the tests with all 3 tags
      const parsed = parseTagsGrep('@tag1+@tag2+@tag3')

      expect(parsed).to.deep.equal([
        // single OR part
        [
          // with 3 AND parts
          { tag: '@tag1', invert: false },
          { tag: '@tag2', invert: false },
          { tag: '@tag3', invert: false },
        ],
      ])
    })

    it('handles dashes in the tag', () => {
      const parsed = parseTagsGrep('@smoke+@screen-b')

      expect(parsed).to.deep.equal([
        [
          { tag: '@smoke', invert: false },
          { tag: '@screen-b', invert: false },
        ],
      ])
    })

    it('parses OR tags spaces', () => {
      // run tests with tag1 OR tag2 or tag3
      const parsed = parseTagsGrep('@tag1 @tag2 @tag3')

      expect(parsed).to.deep.equal([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: false }],
        [{ tag: '@tag3', invert: false }],
      ])
    })

    it('parses OR tags commas', () => {
      // run tests with tag1 OR tag2 or tag3
      const parsed = parseTagsGrep('@tag1,@tag2,@tag3')

      expect(parsed).to.deep.equal([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: false }],
        [{ tag: '@tag3', invert: false }],
      ])
    })

    it('parses inverted tag', () => {
      const parsed = parseTagsGrep('-@tag1')

      expect(parsed).to.deep.equal([[{ tag: '@tag1', invert: true }]])
    })

    it('parses tag1 but not tag2 with space', () => {
      const parsed = parseTagsGrep('@tag1 -@tag2')

      expect(parsed).to.deep.equal([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: true }],
      ])
    })

    it('forgives extra spaces', () => {
      const parsed = parseTagsGrep('  @tag1   -@tag2 ')

      expect(parsed).to.deep.equal([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: true }],
      ])
    })

    it('parses tag1 but not tag2 with comma', () => {
      const parsed = parseTagsGrep('@tag1,-@tag2')

      expect(parsed).to.deep.equal([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: true }],
      ])
    })

    it('filters out empty tags', () => {
      const parsed = parseTagsGrep(',, @tag1,-@tag2,, ,, ,')

      expect(parsed).to.deep.equal([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: true }],
      ])
    })

    // TODO: would need to change the tokenizer
    it.skip('parses tag1 but not tag2', () => {
      const parsed = parseTagsGrep('@tag1-@tag2')

      expect(parsed).to.deep.equal([
        [
          { tag: '@tag1', invert: false },
          { tag: '@tag2', invert: true },
        ],
      ])
    })

    it('allows all tags to be inverted', () => {
      const parsed = parseTagsGrep('--@tag1,--@tag2')

      expect(parsed).to.deep.equal([
        [{ tag: '@tag1', invert: true }, { tag: '@tag2', invert: true }],
      ])
    })
  })

  context('parseGrep', () => {
    // no need to exhaustively test the parsing
    // since we want to confirm it works via test names
    // and not through the implementation details of
    // the parsed object

    it('creates just the title grep', () => {
      const parsed = parseGrep('hello w')

      expect(parsed).to.deep.equal({
        title: [
          {
            title: 'hello w',
            invert: false,
          },
        ],
        tags: [],
      })
    })

    it('creates object from the grep string only', () => {
      const parsed = parseGrep('hello w')

      expect(parsed).to.deep.equal({
        title: [
          {
            title: 'hello w',
            invert: false,
          },
        ],
        tags: [],
      })

      // check how the parsed grep works against specific tests
      expect(shouldTestRun(parsed, 'hello w')).to.equal(true)
      expect(shouldTestRun(parsed, 'hello no')).to.equal(false)
    })

    it('matches one of the titles', () => {
      // also should trim each title
      const parsed = parseGrep('  hello w; work 2  ')

      expect(parsed).to.deep.equal({
        title: [
          {
            title: 'hello w',
            invert: false,
          },
          {
            title: 'work 2',
            invert: false,
          },
        ],
        tags: [],
      })

      // check how the parsed grep works against specific tests
      expect(shouldTestRun(parsed, 'hello w')).to.equal(true)
      expect(shouldTestRun(parsed, 'this work 2 works')).to.equal(true)
      expect(shouldTestRun(parsed, 'hello no')).to.equal(false)
    })

    it('creates object from the grep string and tags', () => {
      const parsed = parseGrep('hello w', '@tag1+@tag2+@tag3')

      expect(parsed).to.deep.equal({
        title: [
          {
            title: 'hello w',
            invert: false,
          },
        ],
        tags: [
          // single OR part
          [
            // with 3 AND parts
            { tag: '@tag1', invert: false },
            { tag: '@tag2', invert: false },
            { tag: '@tag3', invert: false },
          ],
        ],
      })

      // check how the parsed grep works against specific tests
      expect(shouldTestRun(parsed, 'hello w'), 'needs tags').to.equal(false)
      expect(shouldTestRun(parsed, 'hello no')).to.equal(false)
      // not every tag is present
      expect(shouldTestRun(parsed, ['@tag1', '@tag2'])).to.equal(false)
      expect(shouldTestRun(parsed, ['@tag1', '@tag2', '@tag3'])).to.equal(true)
      expect(
        shouldTestRun(parsed, ['@tag1', '@tag2', '@tag3', '@tag4']),
      ).to.equal(true)

      // title matches, but tags do not
      expect(shouldTestRun(parsed, 'hello w', ['@tag1', '@tag2'])).to.equal(
        false,
      )

      // tags and title match
      expect(
        shouldTestRun(parsed, 'hello w', ['@tag1', '@tag2', '@tag3']),
      ).to.equal(true)
    })
  })

  context('shouldTestRunTags', () => {
    // when the user types "used" string
    // and the test has the given tags, make sure
    // our parsing and decision logic computes the expected result
    const shouldIt = (used, tags, expected) => {
      const parsedTags = parseTagsGrep(used)

      expect(
        shouldTestRunTags(parsedTags, tags),
        `"${used}" against "${tags}"`,
      ).to.equal(expected)
    }

    it('handles AND tags', () => {
      shouldIt('smoke+slow', ['fast', 'smoke'], false)
      shouldIt('smoke+slow', ['mobile', 'smoke', 'slow'], true)
      shouldIt('smoke+slow', ['slow', 'extra', 'smoke'], true)
      shouldIt('smoke+slow', ['smoke'], false)
    })

    it('handles OR tags', () => {
      // smoke OR slow
      shouldIt('smoke slow', ['fast', 'smoke'], true)
      shouldIt('smoke', ['mobile', 'smoke', 'slow'], true)
      shouldIt('slow', ['slow', 'extra', 'smoke'], true)
      shouldIt('smoke', ['smoke'], true)
      shouldIt('smoke', ['slow'], false)
    })

    it('handles invert tag', () => {
      // should not run - we are excluding the "slow"
      shouldIt('smoke+-slow', ['smoke', 'slow'], false)
      shouldIt('mobile+-slow', ['smoke', 'slow'], false)
      shouldIt('smoke -slow', ['smoke', 'fast'], true)
      shouldIt('-slow', ['smoke', 'slow'], false)
      shouldIt('-slow', ['smoke'], true)
      // no tags in the test
      shouldIt('-slow', [], true)
    })
  })

  context('shouldTestRun', () => {
    // a little utility function to parse the given grep string
    // and apply the first argument in shouldTestRun
    const checkName = (grep, grepTags) => {
      const parsed = parseGrep(grep, grepTags)

      expect(parsed).to.be.an('object')

      return (testName, testTags = []) => {
        expect(testName, 'test title').to.be.a('string')
        expect(testTags, 'test tags').to.be.an('array')

        return shouldTestRun(parsed, testName, testTags)
      }
    }

    it('simple tag', () => {
      const parsed = parseGrep('@tag1')

      expect(shouldTestRun(parsed, 'no tag1 here')).to.be.false
      expect(shouldTestRun(parsed, 'has @tag1 in the name')).to.be.true
    })

    it('with invert title', () => {
      const t = checkName('-hello')

      expect(t('no greetings')).to.be.true
      expect(t('has hello world')).to.be.false
    })

    it('with invert option', () => {
      const t = checkName(null, '-@tag1')

      expect(t('no tags here')).to.be.true
      expect(t('has tag1', ['@tag1'])).to.be.false
      expect(t('has other tags', ['@tag2'])).to.be.true
    })

    it('with AND option', () => {
      const t = checkName('', '@tag1+@tag2')

      expect(t('no tag1 here')).to.be.false
      expect(t('has only @tag1', ['@tag1'])).to.be.false
      expect(t('has only @tag2', ['@tag2'])).to.be.false
      expect(t('has both tags', ['@tag1', '@tag2'])).to.be.true
    })

    it('with OR option', () => {
      const t = checkName(null, '@tag1 @tag2')

      expect(t('no tag1 here')).to.be.false
      expect(t('has only @tag1 in the name', ['@tag1'])).to.be.true
      expect(t('has only @tag2 in the name', ['@tag2'])).to.be.true
      expect(t('has @tag1 and @tag2 in the name', ['@tag1', '@tag2'])).to.be
      .true
    })

    it('OR with AND option', () => {
      const t = checkName(null, '@tag1 @tag2+@tag3')

      expect(t('no tag1 here')).to.be.false
      expect(t('has only @tag1 in the name', ['@tag1'])).to.be.true
      expect(t('has only @tag2 in the name', ['@tag2'])).to.be.false
      expect(t('has only @tag2 in the name and also @tag3', ['@tag2', '@tag3']))
      .to.be.true

      expect(
        t('has @tag1 and @tag2 and @tag3 in the name', [
          '@tag1',
          '@tag2',
          '@tag3',
        ]),
      ).to.be.true
    })

    it('Multiple invert strings and a simple one', () => {
      const t = checkName('-name;-hey;number')

      expect(t('number should only be matches without a n-a-m-e')).to.be.true
      expect(t('number can\'t be name')).to.be.false
      expect(t('The man needs a name')).to.be.false
      expect(t('number hey name')).to.be.false
      expect(t('numbers hey name')).to.be.false
      expect(t('number hsey nsame')).to.be.true
      expect(t('This wont match')).to.be.false
    })

    it('Only inverted strings', () => {
      const t = checkName('-name;-hey')

      expect(t('I\'m matched')).to.be.true
      expect(t('hey! I\'m not')).to.be.false
      expect(t('My name is weird')).to.be.false
    })
  })

  context('parseFullTitleGrep', () => {
    const shouldIt = (search, testName, expected) => {
      const parsed = parseFullTitleGrep(search)

      expect(
        shouldTestRunTitle(parsed, testName),
        `"${search}" against title "${testName}"`,
      ).to.equal(expected)
    }

    it('passes for substring', () => {
      shouldIt('hello w', 'hello world', true)
      shouldIt('-hello w', 'hello world', false)
    })
  })
})

describe('plugin', () => {
  context('excludeSpecPattern', () => {
    it('supports an array value', () => {
      cy.task('grep', {
        excludeSpecPattern: ['**/test2.spec.js', '**/test3.spec.js'],
        specPattern: '**/*.spec.js',
        env: {
          grepTags: 'smoke',
          grepFilterSpecs: true,
        },
      }).then((config) => {
        expect(config.specPattern.length).to.equal(1)
        expect(config.specPattern[0]).to.contain('test1.spec.js')
      })
    })

    it('supports a string value', () => {
      cy.task('grep', {
        excludeSpecPattern: '**/test2.spec.js',
        specPattern: '**/*.spec.js',
        env: {
          grepTags: 'smoke',
          grepFilterSpecs: true,
        },
      }).then((config) => {
        expect(config.specPattern.length).to.equal(2)
        expect(config.specPattern[0]).to.contain('test1.spec.js')
        expect(config.specPattern[1]).to.contain('test3.spec.js')
      })
    })
  })
})
