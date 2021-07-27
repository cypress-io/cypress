// @ts-nocheck
import faker from 'faker'

const newId = () => faker.datatype.uuid().slice(30)

export function test (state = 'passed', parentId, level) {
  return {
    title: faker.git.commitMessage(),
    type: 'test',
    level,
    id: newId(),
    parentId,
    state,
  }
}

export function suiteContents (level, parentId, id, tests, suites) {
  return {
    root: level === 0,
    type: 'suite',
    title: faker.git.commitMessage(),
    id,
    level,
    parentId,
    tests,
    suites,
  }
}

export function addCommand (logData = {}) {
  return {
    event: false,
    hookId: 'r3',
    id: newId(),
    instrument: 'command',
    renderProps: {},
    state: 'passed',
    testId: newId(),
    testCurrentRetry: 0,
    type: 'parent',
    url: 'http://example.com',
    ...logData,
  }
}

const rootId = newId(1)
const suite1 = newId(2)
const suite2 = newId(3)
const suite3 = newId(4)
const suite4 = newId(5)
const suite5 = newId(6)
const suite6 = newId(7)
const suite7 = newId(8)




export const rootRunnable = {
  root: true,
  id: rootId,
  tests: [
    test('passed', rootId, 1, 15),
    test('passed', rootId, 1, 16),
    test('passed', rootId, 1, 17),
    test('passed', rootId, 1, 18),
    test('passed', rootId, 1, 19),
    test('passed', rootId, 1, 20),
  ],
  suites: [
    suiteContents(
      1, rootId, suite7, [test('processing', suite7, 2, 24), test('not-started', suite7, 2, 24)],
    ),
    suiteContents(
      1, rootId, suite1, [test('passed', suite1, 2, 7)],
    ),
    suiteContents(
      1, rootId, suite2, [test('failed', suite2, 2, 8)],
    ),
    suiteContents(
      1, rootId, suite3, [
        test('pending', suite3, 2, 9),
      ],
      [
        suiteContents(
          2, suite3, suite5, [
            test('passed', suite5, 3, 10),
            test('passed', suite5, 3, 10),
            test('passed', suite5, 3, 10),
          ],
        ),
      ],
    ),
    suiteContents(
      1, rootId, suite4, [test('pending', suite4, 2, 12), test('passed', suite4, 2, 11),
        test('passed', suite4, 2),
        test('passed', suite4, 2)],
    ),
    suiteContents(
      1, rootId, suite6, [
        test('pending', suite5, 3),
        test('pending', suite5, 3),
        test('pending', suite5, 3),
      ],
    ),
  ],

}
