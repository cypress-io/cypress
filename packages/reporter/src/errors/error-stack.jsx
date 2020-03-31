import _ from 'lodash'
import React from 'react'

import ErrorFilePath from './error-file-path'

const ErrorStack = ({ err }) => {
  if (!err.parsedStack) return err.stack

  // only display stack lines beyond the original message, since it's already
  // displayed above this
  let foundFirstStackLine = false
  const stackLines = _.filter(err.parsedStack, ({ message }, index) => {
    if (foundFirstStackLine) return true

    if (message != null) return false

    foundFirstStackLine = true

    return true
  })
  // instead of having every line indented, get rid of the smallest amount of
  // whitespace common to each line so the stack is aligned left but lines
  // with extra whitespace still have it
  const whitespaceLengths = _.map(stackLines, ({ whitespace }) => whitespace ? whitespace.length : 0)
  const commonWhitespaceLength = Math.min(...whitespaceLengths)

  const makeLine = (key, content) => {
    return (
      <div className='err-stack-line' key={key}>{content}</div>
    )
  }

  return _.map(stackLines, (stackLine, index) => {
    const key = `${relativeFile}${index}`

    const whitespace = stackLine.whitespace.slice(commonWhitespaceLength)

    if (stackLine.message != null) {
      return makeLine(key, [whitespace, stackLine.message])
    }

    const { relativeFile, function: fn } = stackLine

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
