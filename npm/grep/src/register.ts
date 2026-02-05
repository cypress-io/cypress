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
      Cypress.env('grep', grep)
      Cypress.env('grepTags', tags)
      Cypress.env('grepBurn', burn)
      Cypress.env('grep-tags', null)
      Cypress.env('grep-burn', null)
      Cypress.env('burn', null)

      debugInstance('set new grep to "%o" restarting tests', { grep, tags, burn })
      restartTests()
    }
  }

  let grep: string | undefined = Cypress.env('grep')

  if (grep) {
    grep = String(grep).trim()
  }

  const grepTags: string | undefined = Cypress.env('grepTags') || Cypress.env('grep-tags')
  const burnSpecified: string | undefined = Cypress.env('grepBurn') || Cypress.env('grep-burn') || Cypress.env('burn')
  const grepUntagged: string | undefined = Cypress.env('grepUntagged') || Cypress.env('grep-untagged')

  if (!grep && !grepTags && !burnSpecified && !grepUntagged) {
    debugInstance('Nothing to grep, version %s', version)

    return
  }

  const grepBurn: number =
    Cypress.env('grepBurn') ||
    Cypress.env('grep-burn') ||
    Cypress.env('burn') ||
    1

  const omitFiltered: boolean =
    Cypress.env('grepOmitFiltered') || Cypress.env('grep-omit-filtered')

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

  // @ts-expect-error - it is missing only, skip, and retries which are overridden below
  it = function itGrep (name: string, options: any, callback?: Func | AsyncFunc): Mocha.Test | void[] {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    if (!callback) {
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

    if (shouldRun) {
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

  const suiteStack: SuiteStackItem[] = []

    // @ts-expect-error - it is missing only and skip which are overridden below
  describe = function describeGrep (name: string, options: any, callback?: Func | AsyncFunc): Mocha.Suite {
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

    if (!configTags || !configTags.length) {
      _describe(name, options, callback)
      suiteStack.pop()

      return
    }

    stackItem.tags = configTags
    _describe(name, options, callback)
    suiteStack.pop()
  }

  context = describe
  specify = it

  it.skip = _it.skip
  it.only = _it.only
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
