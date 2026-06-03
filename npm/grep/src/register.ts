/// <reference types="cypress" />

import { parseGrep, shouldTestRun } from './utils'
import { version } from '../package.json'
import debug from 'debug'
// @ts-ignore
const debugInstance = debug('@cypress/grep')

debugInstance.log = console.info.bind(console)
interface SuiteStackItem {
  name: string
  tags?: string[]
}

// function is intended to be called from the support file
export function register (): void {
  // preserve the real "it" function
  const _it = it
  const _describe = describe

  // define Cypress.grep function
  if (!Cypress.grep) {
    Cypress.grep = function grep (grep?: string, tags?: string, burn?: string): void {
      Cypress.expose('grep', grep)
      Cypress.expose('grepTags', tags)
      Cypress.expose('grepBurn', burn)
      Cypress.expose('grep-tags', null)
      Cypress.expose('grep-burn', null)
      Cypress.expose('burn', null)

      debugInstance('set new grep to "%o" restarting tests', { grep, tags, burn })
      restartTests()
    }
  }

  let grep: string | undefined = Cypress.expose('grep')

  if (grep) {
    grep = String(grep).trim()
  }

  const grepTags: string | undefined = Cypress.expose('grepTags') || Cypress.expose('grep-tags')
  const burnSpecified: string | undefined = Cypress.expose('grepBurn') || Cypress.expose('grep-burn') || Cypress.expose('burn')
  const grepUntagged: string | undefined = Cypress.expose('grepUntagged') || Cypress.expose('grep-untagged')

  if (!grep && !grepTags && !burnSpecified && !grepUntagged) {
    debugInstance('Nothing to grep, version %s', version)

    return
  }

  const grepBurn: number =
    Cypress.expose('grepBurn') ||
    Cypress.expose('grep-burn') ||
    Cypress.expose('burn') ||
    1

  const omitFiltered: boolean =
    Cypress.expose('grepOmitFiltered') || Cypress.expose('grep-omit-filtered')

  debugInstance('grep %o', { grep, grepTags, grepBurn, omitFiltered, version })
  if (!Cypress._.isInteger(grepBurn) || grepBurn < 1) {
    throw new Error(`Invalid grep burn value: ${grepBurn}`)
  }

  const parsedGrep = parseGrep(grep, grepTags)

  debugInstance('parsed grep %o', parsedGrep)

  if (it.name === 'itGrep') {
    debugInstance('already registered @cypress/grep')

    return
  }

  const suiteStack: SuiteStackItem[] = []

  // shared grep decision used by both `it` and `it.only`
  const shouldTestRunWithGrep = (name: string, options: any): boolean => {
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
      !!grepUntagged,
    )

    if (tagsToGrep && tagsToGrep.length) {
      debugInstance(
        'should test "%s" with tags %s run? %s',
        name,
        tagsToGrep.join(','),
        shouldRun,
      )
    } else {
      debugInstance('should test "%s" run? %s', nameToGrep, shouldRun)
    }

    return shouldRun
  }

  const itGrep = function itGrep (name: string, options: any, callback?: Mocha.Func | Mocha.AsyncFunc): Mocha.Test | void[] {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    if (!callback) {
      return _it(name, options)
    }

    if (shouldTestRunWithGrep(name, options)) {
      if (grepBurn > 1) {
        return Cypress._.times(grepBurn, (k) => {
          const fullName = `${name}: burning ${k + 1} of ${grepBurn}`

          _it(fullName, options, callback)
        })
      }

      return _it(name, options, callback)
    }

    if (omitFiltered) {
      return
    }

    return _it.skip(name, options, callback)
  }

  // Mocha's `it.only` re-invokes the global `it` to build the test it then marks
  // as exclusive. Because we've replaced the global `it` with the grep wrapper,
  // we apply the grep decision here and, when the focused test should run,
  // temporarily restore the underlying `it` for that call. Letting the wrapper
  // run for the inner call would drop the test's `options.tags` (mocha forwards
  // only the title and callback) and could wrongly filter or burn the focused
  // test, or crash mocha when the wrapper returns `undefined`/an array instead
  // of a test (see https://github.com/cypress-io/cypress/issues/25062).
  const itGrepOnly = function itGrepOnly (name: string, options: any, callback?: Mocha.Func | Mocha.AsyncFunc): Mocha.Test | void[] {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    if (!callback) {
      // eslint-disable-next-line mocha/no-exclusive-tests -- delegating to mocha's it.only
      return _it.only(name, options)
    }

    if (!shouldTestRunWithGrep(name, options)) {
      if (omitFiltered) {
        return
      }

      return _it.skip(name, options, callback)
    }

    it = _it
    try {
      if (grepBurn > 1) {
        return Cypress._.times(grepBurn, (k) => {
          const fullName = `${name}: burning ${k + 1} of ${grepBurn}`

          // eslint-disable-next-line mocha/no-exclusive-tests -- delegating to mocha's it.only
          _it.only(fullName, options, callback)
        })
      }

      // eslint-disable-next-line mocha/no-exclusive-tests -- delegating to mocha's it.only
      return _it.only(name, options, callback)
    } finally {
      // @ts-expect-error - it is missing only, skip, and retries which are overridden below
      it = itGrep
    }
  }

  // @ts-expect-error - it is missing only, skip, and retries which are overridden below
  it = itGrep

  const describeGrep = function describeGrep (name: string, options: any, callback?: (this: Mocha.Suite) => void): Mocha.Suite {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    const stackItem: SuiteStackItem = { name }

    suiteStack.push(stackItem)

    if (!callback) {
      const result = _describe(name, options)

      suiteStack.pop()

      return result
    }

    let configTags = options && options.tags

    if (typeof configTags === 'string') {
      configTags = [configTags]
    }

    if (configTags && configTags.length) {
      stackItem.tags = configTags
    }

    // NOTE: return the created suite so mocha's `describe.only` (which calls the
    // global `describe` to build the suite it marks as exclusive) does not crash
    const result = _describe(name, options, callback)

    suiteStack.pop()

    return result
  }

  // @ts-expect-error - it is missing only and skip which are overridden below
  describe = describeGrep

  context = describe
  specify = it

  it.skip = _it.skip
  // @ts-expect-error - itGrepOnly requires a name and options, ExclusiveTestFunction allows fewer args
  it.only = itGrepOnly
  it.retries = _it.retries
  // @ts-expect-error - is missing each on Mocha.TestFunction type
  if (typeof _it.each === 'function') {
    // @ts-expect-error - is missing each on Mocha.TestFunction type
    it.each = _it.each
  }

  describe.skip = _describe.skip
  describe.only = _describe.only
  // @ts-expect-error - is missing each on Mocha.Suite type
  if (typeof _describe.each === 'function') {
    // @ts-expect-error - is missing each on Mocha.Suite type
    describe.each = _describe.each
  }
}

function restartTests (): void {
  setTimeout(() => {
    window.top.document.querySelector<HTMLButtonElement>('.reporter .restart').click()
  }, 0)
}
