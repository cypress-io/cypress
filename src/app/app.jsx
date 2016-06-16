import React, { Component } from 'react'
import Header from '../header/header'
import Tests from '../tests/tests'

export default class extends Component {
  render () {
    const headerProps = {
      passed: 5,
      duration: 0.17,
    }
    const beforehook1 = {
      id: 'ab',
      name: 'before each',
      failed: false,
      commands: [
        { id: 'ab', name: 'viewport', message: '500, 500', number: 1, event: false, type: 'parent' },
        { id: 'cd', name: 'visit', message: '/test.html', number: 2, event: false, type: 'parent' },
        { id: 'ef', name: 'xhr', message: 'o GET 500 /users', number: 0, event: true, type: 'parent' },
      ],
    }
    const beforeHook2 = {
      id: 'cd',
      name: 'before each',
      failed: false,
      commands: [
        { id: 'ab', name: 'viewport', message: '500, 500', number: 1, event: false, type: 'parent' },
        { id: 'cd', name: 'visit', message: '/test.html', number: 2, event: false, type: 'parent' },
        { id: 'ef', name: 'xhr', message: 'o GET 500 /users', number: 0, event: true, type: 'parent' },
        { id: 'gh', name: 'viewport', message: '700, 400', number: 3, event: false, type: 'parent' },
      ],
    }
    const testHook = {
      id: 'ef',
      name: 'test',
      failed: false,
      commands: [
        { id: 'ab', name: 'assert', message: 'expected [b]true[/b] to be true', number: 1, event: false, type: 'parent' },
      ],
    }
    const emptyTestHook = {
      id: 'ef',
      name: 'test',
      failed: false,
      commands: [],
    }
    const testsProps = {
      spec: ' / Users / chrisbreiding / Dev / cypress / _playground2 / cypress / integration / foo_spec.coffee',
      tests: [
        { type: 'test', id: 'ab', title: 'has no commands', indent: 5, hooks: [emptyTestHook] },
        { type: 'test', id: 'ef', title: 'test at top level', indent: 5, hooks: [testHook] },
        { type: 'suite', id: 'cd', title: 'top level', indent: 5, children: [
            { type: 'suite', id: 'ef', title: 'second level (1)', indent: 20, children: [
              { type: 'test', id: 'gh', title: 'test in second level (1)', indent: 35, hooks: [beforehook1, testHook] },
              { type: 'test', id: 'ij', title: 'test in second level (2)', indent: 35, hooks: [beforehook1, testHook] },
              { type: 'suite', id: 'kl', title: 'third level (1) - in second level (1)', indent: 35, children: [
                  { type: 'test', id: 'mn', title: 'test in third level (1)', indent: 50, hooks: [beforehook1, testHook] },
              ] },
            ] },
            { type: 'suite', id: 'op', title: 'second level (2)', indent: 20, children: [
              { type: 'suite', id: 'qr', title: 'third level (2) - in second level (2)', indent: 35, children: [
                  { type: 'test', id: 'st', title: 'test in third level (2)', indent: 50, hooks: [beforeHook2, testHook] },
              ] },
            ] },
        ] },
      ],
    }

    return (
      <div>
        <Header {...headerProps} />
        <Tests {...testsProps} />
      </div>
    )
  }
}
