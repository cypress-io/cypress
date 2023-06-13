// @ts-check
/// <reference path="./index.d.ts" />

const { parseGrep, shouldTestRun } = require('./utils')
// @ts-ignore
const { version } = require('../package.json')
const debug = require('debug')('@cypress/grep')

debug.log = console.info.bind(console)

// preserve the real "it" function
const _it = it
const _describe = describe

/**
 * Wraps the "it" and "describe" functions that support tags.
 * @see https://github.com/cypress-io/cypress/tree/develop/npm/grep
 */
function cypressGrep () {
  /** @type {string} Part of the test title go grep */
  let grep = Cypress.env('grep')

  if (grep) {
    grep = String(grep).trim()
  }

  /** @type {string} Raw tags to grep string */
  const grepTags = Cypress.env('grepTags') || Cypress.env('grep-tags')

  const burnSpecified =
    Cypress.env('grepBurn') || Cypress.env('grep-burn') || Cypress.env('burn')

  const grepUntagged =
    Cypress.env('grepUntagged') || Cypress.env('grep-untagged')

  if (!grep && !grepTags && !burnSpecified && !grepUntagged) {
    // nothing to do, the user has no specified the "grep" string
    debug('Nothing to grep, version %s', version)

    return
  }

  /** @type {number} Number of times to repeat each running test */
  const grepBurn =
    Cypress.env('grepBurn') ||
    Cypress.env('grep-burn') ||
    Cypress.env('burn') ||
    1

  /** @type {boolean} Omit filtered tests completely */
  const omitFiltered =
    Cypress.env('grepOmitFiltered') || Cypress.env('grep-omit-filtered')

  debug('grep %o', { grep, grepTags, grepBurn, omitFiltered, version })
  if (!Cypress._.isInteger(grepBurn) || grepBurn < 1) {
    throw new Error(`Invalid grep burn value: ${grepBurn}`)
  }

  const parsedGrep = parseGrep(grep, grepTags)

  debug('parsed grep %o', parsedGrep)

  // prevent multiple registrations
  // https://github.com/cypress-io/cypress-grep/issues/59
  if (it.name === 'itGrep') {
    debug('already registered @cypress/grep')

    return
  }

  it = function itGrep (name, options, callback) {
    if (typeof options === 'function') {
      // the test has format it('...', cb)
      callback = options
      options = {}
    }

    if (!callback) {
      // the pending test by itself
      return _it(name, options)
    }

    let configTags = options && options.tags

    if (typeof configTags === 'string') {
      configTags = [configTags]
    }

    const nameToGrep = suiteStack
    .map((item) => item.name)
    .concat(name)
    .join(' ')
    const tagsToGrep = suiteStack
    .flatMap((item) => item.tags)
    .concat(configTags)
    .filter(Boolean)

    const shouldRun = shouldTestRun(
      parsedGrep,
      nameToGrep,
      tagsToGrep,
      grepUntagged,
    )

    if (tagsToGrep && tagsToGrep.length) {
      debug(
        'should test "%s" with tags %s run? %s',
        name,
        tagsToGrep.join(','),
        shouldRun,
      )
    } else {
      debug('should test "%s" run? %s', nameToGrep, shouldRun)
    }

    if (shouldRun) {
      if (grepBurn > 1) {
        // repeat the same test to make sure it is solid
        return Cypress._.times(grepBurn, (k) => {
          const fullName = `${name}: burning ${k + 1} of ${grepBurn}`

          _it(fullName, options, callback)
        })
      }

      return _it(name, options, callback)
    }

    if (omitFiltered) {
      // omit the filtered tests completely
      return
    }

    // skip tests without grep string in their names
    return _it.skip(name, options, callback)
  }

  // list of "describe" suites for the current test
  // when we encounter a new suite, we push it to the stack
  // when the "describe" function exits, we pop it
  // Thus a test can look up the tags from its parent suites
  const suiteStack = []

  describe = function describeGrep (name, options, callback) {
    if (typeof options === 'function') {
      // the block has format describe('...', cb)
      callback = options
      options = {}
    }

    const stackItem = { name }

    suiteStack.push(stackItem)

    if (!callback) {
      // the pending suite by itself
      const result = _describe(name, options)

      suiteStack.pop()

      return result
    }

    let configTags = options && options.tags

    if (typeof configTags === 'string') {
      configTags = [configTags]
    }

    if (!configTags || !configTags.length) {
      // if the describe suite does not have explicit tags
      // move on, since the tests inside can have their own tags
      _describe(name, options, callback)
      suiteStack.pop()

      return
    }

    // when looking at the suite of the tests, I found
    // that using the name is quickly becoming very confusing
    // and thus we need to use the explicit tags
    stackItem.tags = configTags
    _describe(name, options, callback)
    suiteStack.pop()

    return
  }

  // overwrite "context" which is an alias to "describe"
  context = describe

  // overwrite "specify" which is an alias to "it"
  specify = it

  // keep the ".skip", ".only" methods the same as before
  it.skip = _it.skip
  it.only = _it.only
  // preserve "it.each" method if found
  // https://github.com/cypress-io/cypress-grep/issues/72
  if (typeof _it.each === 'function') {
    it.each = _it.each
  }

  describe.skip = _describe.skip
  describe.only = _describe.only
  if (typeof _describe.each === 'function') {
    describe.each = _describe.each
  }
}

function restartTests () {
  setTimeout(() => {
    window.top.document.querySelector('.reporter .restart').click()
  }, 0)
}

if (!Cypress.grep) {
  /**
   * A utility method to set the grep and run the tests from
   * the DevTools console. Restarts the test runner
   * @example
   *  // run only the tests with "hello w" in the title
   *  Cypress.grep('hello w')
   *  // runs only tests tagged both "@smoke" and "@fast"
   *  Cypress.grep(null, '@smoke+@fast')
   *  // runs the grepped tests 100 times
   *  Cypress.grep('add items', null, 100)
   *  // remove all current grep settings
   *  // and run all tests
   *  Cypress.grep()
   * @see "Grep from DevTools console" https://github.com/cypress-io/cypress/tree/develop/npm/grep#devtools-console
   */
  Cypress.grep = function grep (grep, tags, burn) {
    Cypress.env('grep', grep)
    Cypress.env('grepTags', tags)
    Cypress.env('grepBurn', burn)
    // remove any aliased values
    Cypress.env('grep-tags', null)
    Cypress.env('grep-burn', null)
    Cypress.env('burn', null)

    debug('set new grep to "%o" restarting tests', { grep, tags, burn })
    restartTests()
  }
}

module.exports = cypressGrep
