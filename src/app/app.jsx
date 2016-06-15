import React, { Component } from 'react'
import Header from '../header/header'
import Tests from '../tests/tests'

export default class extends Component {
  render () {
    const headerProps = {
      passed: 5,
      duration: 0.17,
    }
    const testsProps = {
      spec: ' / Users / chrisbreiding / Dev / cypress / _playground2 / cypress / integration / foo_spec.coffee',
      tests: [
        { type: 'test', id: 'ab', title: 'test at top level', indent: 5 },
        { type: 'suite', id: 'cd', title: 'top level', indent: 5, children: [
            { type: 'suite', id: 'ef', title: 'second level (1)', indent: 20, children: [
              { type: 'test', id: 'gh', title: 'test in second level (1)', indent: 35 },
              { type: 'test', id: 'ij', title: 'test in second level (2)', indent: 35 },
              { type: 'suite', id: 'kl', title: 'third level (1) - in second level (1)', indent: 35, children: [
                  { type: 'test', id: 'mn', title: 'test in third level (1)', indent: 50 },
              ] },
            ] },
            { type: 'suite', id: 'op', title: 'second level (2)', indent: 20, children: [
              { type: 'suite', id: 'qr', title: 'third level (2) - in second level (2)', indent: 35, children: [
                  { type: 'test', id: 'st', title: 'test in third level (2)', indent: 50 },
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
