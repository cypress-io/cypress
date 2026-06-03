import { expect, describe, it, vi } from 'vitest'
import {
  parseGrep,
  parseTitleGrep,
  parseFullTitleGrep,
  parseTagsGrep,
  shouldTestRun,
  shouldTestRunTags,
  shouldTestRunTitle,
} from '../src/utils'
import { plugin } from '../src/plugin'

describe('utils', () => {
  describe('parseTitleGrep', () => {
    it('grabs the positive title', () => {
      const parsed = parseTitleGrep('hello w')

      expect(parsed).toEqual({
        title: 'hello w',
        invert: false,
      })
    })

    it('trims the string', () => {
      const parsed = parseTitleGrep('   hello w  ')

      expect(parsed).toEqual({
        title: 'hello w',
        invert: false,
      })
    })

    it('inverts the string', () => {
      const parsed = parseTitleGrep('-hello w')

      expect(parsed).toEqual({
        title: 'hello w',
        invert: true,
      })
    })

    it('trims the inverted the string', () => {
      const parsed = parseTitleGrep('  -hello w  ')

      expect(parsed).toEqual({
        title: 'hello w',
        invert: true,
      })
    })

    it('returns null for undefined input', () => {
      // @ts-expect-error - bad args
      const parsed = parseTitleGrep()

      expect(parsed).toEqual(null)
    })
  })

  describe('parseFullTitleGrep', () => {
    it('returns list of title greps', () => {
      const parsed = parseFullTitleGrep('hello; one; -two')

      expect(parsed).toEqual([
        { title: 'hello', invert: false },
        { title: 'one', invert: false },
        { title: 'two', invert: true },
      ])
    })
  })

  describe('parseTagsGrep', () => {
    it('parses AND tags', () => {
      // run only the tests with all 3 tags
      const parsed = parseTagsGrep('@tag1+@tag2+@tag3')

      expect(parsed).toEqual([
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

      expect(parsed).toEqual([
        [
          { tag: '@smoke', invert: false },
          { tag: '@screen-b', invert: false },
        ],
      ])
    })

    it('parses OR tags spaces', () => {
      // run tests with tag1 OR tag2 or tag3
      const parsed = parseTagsGrep('@tag1 @tag2 @tag3')

      expect(parsed).toEqual([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: false }],
        [{ tag: '@tag3', invert: false }],
      ])
    })

    it('parses OR tags commas', () => {
      // run tests with tag1 OR tag2 or tag3
      const parsed = parseTagsGrep('@tag1,@tag2,@tag3')

      expect(parsed).toEqual([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: false }],
        [{ tag: '@tag3', invert: false }],
      ])
    })

    it('parses inverted tag', () => {
      const parsed = parseTagsGrep('-@tag1')

      expect(parsed).toEqual([[{ tag: '@tag1', invert: true }]])
    })

    it('parses tag1 but not tag2 with space', () => {
      const parsed = parseTagsGrep('@tag1 -@tag2')

      expect(parsed).toEqual([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: true }],
      ])
    })

    it('forgives extra spaces', () => {
      const parsed = parseTagsGrep('  @tag1   -@tag2 ')

      expect(parsed).toEqual([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: true }],
      ])
    })

    it('parses tag1 but not tag2 with comma', () => {
      const parsed = parseTagsGrep('@tag1,-@tag2')

      expect(parsed).toEqual([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: true }],
      ])
    })

    it('filters out empty tags', () => {
      const parsed = parseTagsGrep(',, @tag1,-@tag2,, ,, ,')

      expect(parsed).toEqual([
        [{ tag: '@tag1', invert: false }],
        [{ tag: '@tag2', invert: true }],
      ])
    })

    // TODO: would need to change the tokenizer
    it.skip('parses tag1 but not tag2', () => {
      const parsed = parseTagsGrep('@tag1-@tag2')

      expect(parsed).toEqual([
        [
          { tag: '@tag1', invert: false },
          { tag: '@tag2', invert: true },
        ],
      ])
    })

    it('allows all tags to be inverted', () => {
      const parsed = parseTagsGrep('--@tag1,--@tag2')

      expect(parsed).toEqual([
        [{ tag: '@tag1', invert: true }, { tag: '@tag2', invert: true }],
      ])
    })
  })

  describe('parseGrep', () => {
    // no need to exhaustively test the parsing
    // since we want to confirm it works via test names
    // and not through the implementation details of
    // the parsed object

    it('creates just the title grep', () => {
      const parsed = parseGrep('hello w')

      expect(parsed).toEqual({
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

      expect(parsed).toEqual({
        title: [
          {
            title: 'hello w',
            invert: false,
          },
        ],
        tags: [],
      })

      // check how the parsed grep works against specific tests
      expect(shouldTestRun(parsed, 'hello w')).toEqual(true)
      expect(shouldTestRun(parsed, 'hello no')).toEqual(false)
    })

    it('matches one of the titles', () => {
      // also should trim each title
      const parsed = parseGrep('  hello w; work 2  ')

      expect(parsed).toEqual({
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
      expect(shouldTestRun(parsed, 'hello w')).toEqual(true)
      expect(shouldTestRun(parsed, 'this work 2 works')).toEqual(true)
      expect(shouldTestRun(parsed, 'hello no')).toEqual(false)
    })

    it('creates object from the grep string and tags', () => {
      const parsed = parseGrep('hello w', '@tag1+@tag2+@tag3')

      expect(parsed).toEqual({
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
      expect(shouldTestRun(parsed, 'hello w'), 'needs tags').toEqual(false)
      expect(shouldTestRun(parsed, 'hello no')).toEqual(false)
      // not every tag is present
      expect(shouldTestRun(parsed, '', ['@tag1', '@tag2'])).toEqual(false)
      expect(shouldTestRun(parsed, '', ['@tag1', '@tag2', '@tag3'])).toEqual(true)
      expect(
        shouldTestRun(parsed, '', ['@tag1', '@tag2', '@tag3', '@tag4']),
      ).toEqual(true)

      // title matches, but tags do not
      expect(shouldTestRun(parsed, 'hello w', ['@tag1', '@tag2'])).toEqual(
        false,
      )

      // tags and title match
      expect(
        shouldTestRun(parsed, 'hello w', ['@tag1', '@tag2', '@tag3']),
      ).toEqual(true)
    })
  })

  describe('shouldTestRunTags', () => {
    // when the user types "used" string
    // and the test has the given tags, make sure
    // our parsing and decision logic computes the expected result
    const shouldIt = (used, tags, expected) => {
      const parsedTags = parseTagsGrep(used)

      expect(
        shouldTestRunTags(parsedTags, tags),
        `"${used}" against "${tags}"`,
      ).toEqual(expected)
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

  describe('shouldTestRun', () => {
    // a little utility function to parse the given grep string
    // and apply the first argument in shouldTestRun
    const checkName = (grep: string, grepTags?: string) => {
      const parsed = parseGrep(grep, grepTags)

      expect(typeof parsed).toEqual('object')

      return (testName, testTags = []) => {
        expect(typeof testName, 'test title').toEqual('string')
        expect(testTags, 'test tags').toBeInstanceOf(Array)

        return shouldTestRun(parsed, testName, testTags)
      }
    }

    it('simple tag', () => {
      const parsed = parseGrep('@tag1')

      expect(shouldTestRun(parsed, 'no tag1 here')).toEqual(false)
      expect(shouldTestRun(parsed, 'has @tag1 in the name')).toEqual(true)
    })

    it('with invert title', () => {
      const t = checkName('-hello')

      expect(t('no greetings')).toEqual(true)
      expect(t('has hello world')).toEqual(false)
    })

    it('with invert option', () => {
      const t = checkName(null, '-@tag1')

      expect(t('no tags here')).toEqual(true)
      expect(t('has tag1', ['@tag1'])).toEqual(false)
      expect(t('has other tags', ['@tag2'])).toEqual(true)
    })

    it('with AND option', () => {
      const t = checkName('', '@tag1+@tag2')

      expect(t('no tag1 here')).toEqual(false)
      expect(t('has only @tag1', ['@tag1'])).toEqual(false)
      expect(t('has only @tag2', ['@tag2'])).toEqual(false)
      expect(t('has both tags', ['@tag1', '@tag2'])).toEqual(true)
    })

    it('with OR option', () => {
      const t = checkName(null, '@tag1 @tag2')

      expect(t('no tag1 here')).toEqual(false)
      expect(t('has only @tag1 in the name', ['@tag1'])).toEqual(true)
      expect(t('has only @tag2 in the name', ['@tag2'])).toEqual(true)
      expect(t('has @tag1 and @tag2 in the name', ['@tag1', '@tag2'])).toEqual(true)
    })

    it('OR with AND option', () => {
      const t = checkName(null, '@tag1 @tag2+@tag3')

      expect(t('no tag1 here')).toEqual(false)
      expect(t('has only @tag1 in the name', ['@tag1'])).toEqual(true)
      expect(t('has only @tag2 in the name', ['@tag2'])).toEqual(false)
      expect(t('has only @tag2 in the name and also @tag3', ['@tag2', '@tag3']))
      .toEqual(true)

      expect(
        t('has @tag1 and @tag2 and @tag3 in the name', [
          '@tag1',
          '@tag2',
          '@tag3',
        ]),
      ).toEqual(true)
    })

    it('Multiple invert strings and a simple one', () => {
      const t = checkName('-name;-hey;number')

      expect(t('number should only be matches without a n-a-m-e')).toEqual(true)
      expect(t('number can\'t be name')).toEqual(false)
      expect(t('The man needs a name')).toEqual(false)
      expect(t('number hey name')).toEqual(false)
      expect(t('numbers hey name')).toEqual(false)
      expect(t('number hsey nsame')).toEqual(true)
      expect(t('This wont match')).toEqual(false)
    })

    it('Only inverted strings', () => {
      const t = checkName('-name;-hey')

      expect(t('I\'m matched')).toEqual(true)
      expect(t('hey! I\'m not')).toEqual(false)
      expect(t('My name is weird')).toEqual(false)
    })
  })

  describe('parseFullTitleGrep', () => {
    const shouldIt = (search, testName, expected) => {
      const parsed = parseFullTitleGrep(search)

      expect(
        shouldTestRunTitle(parsed, testName),
        `"${search}" against title "${testName}"`,
      ).toEqual(expected)
    }

    it('passes for substring', () => {
      shouldIt('hello w', 'hello world', true)
      shouldIt('-hello w', 'hello world', false)
    })
  })

  describe('plugin', () => {
    describe('grepOmitFiltered message', () => {
      const mockConfig = {
        specPattern: ['**/*.cy.ts'],
        excludeSpecPattern: [],
        expose: {},
      }

      it('does not print "will omit filtered tests" when no filter is set', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

        plugin({ ...mockConfig, expose: { grepOmitFiltered: true } })

        const calls = consoleSpy.mock.calls.map((args) => args[0])

        expect(calls).not.toContain('@cypress/grep: non-matching tests will be omitted from results (not skipped)')
        consoleSpy.mockRestore()
      })

      it('prints "will omit filtered tests" when grep filter is set', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

        plugin({ ...mockConfig, expose: { grepOmitFiltered: true, grep: 'myTest' } })

        const calls = consoleSpy.mock.calls.map((args) => args[0])

        expect(calls).toContain('@cypress/grep: non-matching tests will be omitted from results (not skipped)')
        consoleSpy.mockRestore()
      })

      it('prints "will omit filtered tests" when grepTags filter is set', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

        plugin({ ...mockConfig, expose: { grepOmitFiltered: true, grepTags: '@smoke' } })

        const calls = consoleSpy.mock.calls.map((args) => args[0])

        expect(calls).toContain('@cypress/grep: non-matching tests will be omitted from results (not skipped)')
        consoleSpy.mockRestore()
      })

      it('prints "will omit filtered tests" when grepUntagged is set', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

        plugin({ ...mockConfig, expose: { grepOmitFiltered: true, grepUntagged: true } })

        const calls = consoleSpy.mock.calls.map((args) => args[0])

        expect(calls).toContain('@cypress/grep: non-matching tests will be omitted from results (not skipped)')
        consoleSpy.mockRestore()
      })
    })

    describe('could-not-pre-filter notice', () => {
      const noMatchMessage = '@cypress/grep: could not pre-filter specs because none appeared to contain tests matching the filter:'
      // use a spec pattern that matches no files so the outcome is deterministic
      const mockConfig = {
        specPattern: ['**/__does_not_exist__/*.cy.ts'],
        excludeSpecPattern: [],
        expose: {},
      }

      it('says nothing when grepFilterSpecs is set but no grep/grepTags is in use', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

        plugin({ ...mockConfig, expose: { grepFilterSpecs: true } })

        const calls = consoleSpy.mock.calls.map((args) => args[0])

        expect(calls).not.toContain(noMatchMessage)
        consoleSpy.mockRestore()
      })

      it('logs the notice when grep is set but matches no specs', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

        plugin({ ...mockConfig, expose: { grepFilterSpecs: true, grep: 'noMatch' } })

        const calls = consoleSpy.mock.calls.map((args) => args[0])

        expect(calls).toContain(noMatchMessage)
        consoleSpy.mockRestore()
      })

      it('logs the notice when grepTags is set but matches no specs', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

        plugin({ ...mockConfig, expose: { grepFilterSpecs: true, grepTags: '@noMatch' } })

        const calls = consoleSpy.mock.calls.map((args) => args[0])

        expect(calls).toContain(noMatchMessage)
        consoleSpy.mockRestore()
      })

      it('does not emit the notice as a warning', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        vi.spyOn(console, 'log').mockImplementation(() => {})
        plugin({ ...mockConfig, expose: { grepFilterSpecs: true, grep: 'noMatch' } })

        const warnCalls = warnSpy.mock.calls.map((args) => args[0])

        expect(warnCalls).not.toContain(noMatchMessage)
        vi.restoreAllMocks()
      })
    })

    describe('grepFilterSpecs handling', () => {
      const mockConfig = {
        specPattern: ['**/*.cy.ts'],
        excludeSpecPattern: [],
        expose: {},
      }

      it('handles boolean true', () => {
        const config = {
          ...mockConfig,
          expose: { grepFilterSpecs: true },
        }
        const result = plugin(config)

        expect(result).toBeDefined()
      })

      it('handles string "true"', () => {
        const config = {
          ...mockConfig,
          expose: { grepFilterSpecs: 'true' },
        }
        const result = plugin(config)

        expect(result).toBeDefined()
      })

      it('handles string "TRUE"', () => {
        const config = {
          ...mockConfig,
          expose: { grepFilterSpecs: 'TRUE' },
        }
        const result = plugin(config)

        expect(result).toBeDefined()
      })

      it('handles string "True" (mixed case)', () => {
        const config = {
          ...mockConfig,
          expose: { grepFilterSpecs: 'True' },
        }
        const result = plugin(config)

        expect(result).toBeDefined()
      })

      it('handles boolean false', () => {
        const config = {
          ...mockConfig,
          expose: { grepFilterSpecs: false },
        }
        const result = plugin(config)

        expect(result).toBeDefined()
      })

      it('handles string "false"', () => {
        const config = {
          ...mockConfig,
          expose: { grepFilterSpecs: 'false' },
        }
        const result = plugin(config)

        expect(result).toBeDefined()
      })

      it('handles undefined', () => {
        const config = {
          ...mockConfig,
          expose: {},
        }
        const result = plugin(config)

        expect(result).toBeDefined()
      })
    })
  })
})
