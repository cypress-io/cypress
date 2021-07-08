import RunnablesList from '../runnables/RunnablesList.vue'
import Hook from './Hook.vue'
import { Runnables } from '../store/reporter-store'

const hooksRunnable = Runnables({
  "id": "r1",
  "title": "",
  type: 'suite',  
  "root": true,
  "hooks": [
    {
      "hookId": "h1",
      "hookName": "before each",
      "invocationDetails": {
        "absoluteFile": "/absolute/path/to/foo_spec.js",
        "column": 4,
        "line": 10,
        "originalFile": "path/to/foo_spec.js",
        "relativeFile": "path/to/foo_spec.js"
      }
    }
  ],
  "tests": [],
  "suites": [
    {
      "id": "r2",
      "title": "suite 1",
      type: 'suite',
      "root": false,
      "hooks": [
        {
          "hookId": "h2",
          "hookName": "after each"
        },
        {
          "hookId": "h3",
          "hookName": "before each"
        }
      ],
      "tests": [
        {
          "id": "r3",
          type: 'test',
          "title": "test 1",
          "state": "passed",
          "commands": [
            {
              "hookId": "h1",
              "id": "c1",
              "instrument": "command",
              "message": "http://localhost:3000",
              "name": "visit",
              "state": "passed",
              "testId": "r3",
              "timeout": 4000,
              "type": "parent"
            },
            {
              "hookId": "h1",
              "id": "c2",
              "instrument": "command",
              "message": ".wrapper",
              "name": "get",
              "state": "passed",
              "testId": "r3",
              "timeout": 4000,
              "type": "parent"
            },
            {
              "hookId": "r3",
              "id": "c3",
              "instrument": "command",
              "message": ".body",
              "name": "get",
              "state": "passed",
              "testId": "r3",
              "timeout": 4000,
              "type": "parent"
            },
            {
              "hookId": "h2",
              "id": "c4",
              "instrument": "command",
              "message": ".cleanup",
              "name": "get",
              "state": "passed",
              "testId": "r3",
              "timeout": 4000,
              "type": "parent"
            }
          ],
          "invocationDetails": {
            "absoluteFile": "/absolute/path/to/foo_spec.js",
            "column": 8,
            "line": 34,
            "originalFile": "path/to/foo_spec.js",
            "relativeFile": "path/to/foo_spec.js"
          }
        },
        {
          "id": "r6",
          "title": "test 2",
          "state": "failed",
          type: 'test',
          "commands": [
            {
              "hookId": "h3",
              "id": "c5",
              "instrument": "command",
              "message": "http://localhost:3000",
              "name": "visit",
              "state": "passed",
              "testId": "r6",
              "timeout": 4000,
              "type": "parent"
            },
            {
              "hookId": "h3",
              "id": "c6",
              "instrument": "command",
              "message": ".wrapper",
              "name": "get",
              "state": "failed",
              "testId": "r6",
              "timeout": 4000,
              "type": "parent"
            }
          ],
          "invocationDetails": {
            "absoluteFile": "/absolute/path/to/foo_spec.js",
            "column": 8,
            "line": 34,
            "originalFile": "path/to/foo_spec.js",
            "relativeFile": "path/to/foo_spec.js"
          }
        }
      ],
      // suites: []
      "suites": [
        {
          "id": "r4",
          "title": "nested suite 1",
          "root": false,
          type: 'suite',  
          "hooks": [
            {
              "hookId": "h3",
              "hookName": "before all"
            },
            {
              "hookId": "h4",
              "hookName": "before all"
            },
            {
              "hookId": "h5",
              "hookName": "before each"
            }
          ],
          "tests": [
            {
              "id": "r5",
              type: 'test',
              "title": "test 3",
              "state": "passed",
              "commands": [
                {
                  "hookId": "h3",
                  "id": "c5",
                  "instrument": "command",
                  "message": "before1",
                  "name": "log",
                  "state": "passed",
                  "testId": "r5",
                  "timeout": 4000,
                  "type": "parent"
                },
                {
                  "hookId": "h4",
                  "id": "c5",
                  "instrument": "command",
                  "message": "before2",
                  "name": "log",
                  "state": "passed",
                  "testId": "r5",
                  "timeout": 4000,
                  "type": "parent"
                },
                {
                  "hookId": "h1",
                  "id": "c5",
                  "instrument": "command",
                  "message": "http://localhost:3000",
                  "name": "visit",
                  "state": "passed",
                  "testId": "r5",
                  "timeout": 4000,
                  "type": "parent"
                },
                {
                  "hookId": "h1",
                  "id": "c6",
                  "instrument": "command",
                  "message": ".wrapper",
                  "name": "get",
                  "state": "passed",
                  "testId": "r5",
                  "timeout": 4000,
                  "type": "parent"
                },
                {
                  "hookId": "h5",
                  "id": "c7",
                  "instrument": "command",
                  "message": ".header",
                  "name": "get",
                  "state": "passed",
                  "testId": "r5",
                  "timeout": 4000,
                  "type": "parent"
                },
                {
                  "hookId": "r5",
                  "id": "c8",
                  "instrument": "command",
                  "message": ".body",
                  "name": "get",
                  "state": "passed",
                  "testId": "r5",
                  "timeout": 4000,
                  "type": "parent"
                },
                {
                  "hookId": "h2",
                  "id": "c9",
                  "instrument": "command",
                  "message": ".cleanup",
                  "name": "get",
                  "state": "passed",
                  "testId": "r5",
                  "timeout": 4000,
                  "type": "parent"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
})


it('renders', () => {
  const hook = {
    hookId: 'h1',
    hookName: 'before each',
    testId: 'r3',
  }

  cy.mount(Hook, {
    props: {
      hook: hooksRunnable.getHook(hook),
      count: 1,
      idx: 0
    }
  })
})