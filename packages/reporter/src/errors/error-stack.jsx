import _ from 'lodash'
import React from 'react'

import ErrorFilePath from './error-file-path'

const ErrorStack = ({ err }) => {
  if (!err.parsedStack) return err.stack

  const makeLine = (key, content) => {
    return (
      <div key={key}>{content}</div>
    )
  }

  return _.map(err.parsedStack, (stackLine, index) => {
    const key = `${relativeFile}${index}`

    if (stackLine.message != null) {
      return makeLine(key, stackLine.message)
    }

    const { relativeFile, function: fn, whitespace } = stackLine

    const link = (
      <ErrorFilePath
        key={key}
        fileDetails={stackLine}
      />
    )

    return makeLine(key, [whitespace, `at ${fn} (`, link, ')'])
  })
}

export default ErrorStack
