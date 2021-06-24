// @ts-nocheck
import { setUserEditor } from '@packages/server/lib/util/editors'
import faker from 'faker'
import _ from 'lodash'

const id = (seed) => faker.datatype.uuid(seed).slice(30)

export function test (state = 'passed', parentId = id(seed), level, seed) {
  return {
    title: faker.git.commitMessage(seed),
    type: 'test',
    level,
    id: id(seed),
    parentId,
    state,
  }
}

function suiteContents (level, parentId, seed) {
  return {
    type: 'suite',
    id: faker.datatype.uuid(setUserEditor).slice(30),
    level,
    parentId,
    title: faker.git.commitMessage(seed),
    tests: [],
    suites: [],
  }
}

function suite (options = { seed, depth: 0, currentDepth: 0, numberOfChildSuites: 0, numberOfTestsByType: {}, runnables: [] }) {
  const targetDepth = options.depth
  const currentDepth = options.currentDepth
  const numberOfTestsByType = options.numberOfTestsByType
  const runnables = options.runnables || []
  const numberOfChildSuites = options.numberOfChildSuites
  const _suite = suiteContents(currentDepth)

  runnables.push(_suite)

  if (targetDepth === currentDepth) return options

  _suite.tests = _suite.tests.concat(_.map(numberOfTestsByType, (v, key) => {
    numberOfTestsByType

    const ret = _.range(1, numberOfTestsByType[key] + 1).map((idx) => {
      return test(key, _suite.id, currentDepth + 1, 123)
    })

    return ret
  }))

  _suite.suites = _suite.suites.concat(_.range(0, numberOfChildSuites)
  .map((count) => {
    const content = suiteContents(currentDepth + 1, _suite.id, 123)

    content.suites = content.suites.push(
      suite({
        seed,
        numberOfChildSuites: numberOfChildSuites - 1,
        depth: 2,
        currentDepth: 0,
        runnables,
        numberOfTestsByType: options.numberOfTestsByType,
      }),
    )

    return content
  }))

  return options
}

export default function generate (options, seed = 1) {
  const defaultOptions = {
    numberOfChildSuites: 2,
    numberOfTestsByType: { passed: 2, failed: 9, pending: 1 },
    depth: 4,
  }
  const result = suite({
    ...defaultOptions,
    ...options,

    seed,
    runnables: [],
    currentDepth: 0,
  })

  return JSON.stringify(result, null, 2)
}
