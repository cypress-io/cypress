/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import TestError from './test-error'
import TestModel, { TestProps } from '../test/test-model'
import { CodeFrame } from './err-model'

describe('Test error', () => {
  it('shows', () => {
    const codeFrame: CodeFrame = {
      absoluteFile: '/path/to/the/file.js',
      column: 20,
      line: 808,
      originalFile: '/path/to/original/source/file.js',
      relativeFile: 'src/file.js',

      frame: 'foo\nbar',
      language: 'javascript',
    }

    const err = {
      name: 'Component error',
      message: 'SomeError',
    }

    err.codeFrame = codeFrame

    const testProps = {
      state: 'failed',
      isOpen: true,
      commands: [],
      err,
    }
    const level = 0
    const test = new TestModel(testProps, level)

    mount(
      <div className="reporter">
        <div className="test runnable runnable-failed">
          <TestError model={test} />
        </div>
      </div>,
      {
        stylesheets: '/dist/reporter.css',
      },
    )
  })
})
