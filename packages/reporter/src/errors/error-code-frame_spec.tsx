/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import ErrorCodeFrame from './error-code-frame'
import { CodeFrame } from './err-model'

describe('Error code frame', () => {
  it('shows the error', () => {
    const codeFrame: CodeFrame = {
      absoluteFile: '/path/to/the/file.js',
      column: 20,
      line: 808,
      originalFile: '/path/to/original/source/file.js',
      relativeFile: 'src/file.js',

      frame: 'foo\nbar',
      language: 'javascript',
    }

    mount(
      <div className="reporter">
        <ErrorCodeFrame codeFrame={codeFrame} />
      </div>,
      {
        stylesheets: '/dist/reporter.css',
      },
    )
  })
})
