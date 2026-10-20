import _ from 'lodash'

interface RunnableHook {
  hookId: string
  [key: string]: any
}

interface RunnableTest {
  id: string
  hooks?: RunnableHook[]
  [key: string]: any
}

interface RunnableSuite {
  hooks?: RunnableHook[]
  tests?: RunnableTest[]
  suites?: RunnableSuite[]
  [key: string]: any
}

export const flattenSuiteIntoRunnables = (rootSuite?: RunnableSuite | null) => {
  const tests: RunnableTest[] = []
  const hooks: RunnableHook[] = []
  const hookIdsByTestId: Record<string, string[]> = {}

  const flatten = (suite: RunnableSuite | undefined, inheritedHooks: RunnableHook[]) => {
    // if we dont have a suite, return early
    if (!suite || !suite.suites) {
      return
    }

    // union, not concat: when the command log is shown, the reporter has already merged these
    const suiteHooks = _.unionBy(suite.hooks, inheritedHooks, 'hookId')

    _.each(suite.tests, (test) => {
      tests.push(test)
      hookIdsByTestId[test.id] = _.map(_.unionBy(test.hooks, suiteHooks, 'hookId'), 'hookId')
    })

    hooks.push(...(suite.hooks ?? []))

    _.each(suite.suites, (childSuite) => flatten(childSuite, suiteHooks))
  }

  flatten(rootSuite ?? undefined, [])

  return { tests, hooks, hookIdsByTestId }
}
