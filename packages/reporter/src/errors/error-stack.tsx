import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { ReactElement } from 'react'

import FileNameOpener from '../lib/file-name-opener'
import Err, { ParsedStackFileLine, ParsedStackMessageLine } from './err-model'

const cypressLineRegex = /(cypress:\/\/|cypress_runner\.js)/

interface Props {
  err: Err,
}

type StringOrElement = string | ReactElement

const ErrorStack = observer(({ err }: Props) => {
  if (!err.parsedStack) return <>err.stack</>

  // only display stack lines beyond the original message, since it's already
  // displayed above this
  let foundFirstStackLine = false
  const stackLines = _.filter(err.parsedStack, (line) => {
    if (foundFirstStackLine) return true

    if ((line as ParsedStackMessageLine).message != null) return false

    foundFirstStackLine = true

    return true
  })
  // instead of having every line indented, get rid of the smallest amount of
  // whitespace common to each line so the stack is aligned left but lines
  // with extra whitespace still have it
  const whitespaceLengths = _.map(stackLines, ({ whitespace }) => whitespace ? whitespace.length : 0)
  const commonWhitespaceLength = Math.min(...whitespaceLengths)

  const makeLine = (key: string, content: StringOrElement[]) => {
    return (
      <div className='err-stack-line' key={key}>{content}</div>
    )
  }

  let stopLinking = false
  const lines = _.map(stackLines, (stackLine, index) => {
    const { originalFile, function: fn, line, column, absoluteFile } = stackLine as ParsedStackFileLine
    const key = `${originalFile}${index}`

    const whitespace = stackLine.whitespace.slice(commonWhitespaceLength)

    if ((stackLine as ParsedStackMessageLine).message != null) {
      // we append some errors with 'node internals', which we don't want to link
      // so stop linking anything after 'From Node.js Internals'
      if ((stackLine as ParsedStackMessageLine).message.includes('From Node')) {
        stopLinking = true
      }

      return makeLine(key, [whitespace, (stackLine as ParsedStackMessageLine).message])
    }

    if (stopLinking) {
      // we have already shown a good link, so no need to make
      // clickable links deep in the woods of the stack trace
      return makeLine(key, [whitespace, `at ${fn} (${originalFile}:${line}:${column})`])
    }

    // decide if can show "open file in IDE" link or not
    // sometimes we can determine the file on disk, but if
    // there are no source maps, or the file was transpiled in the browser
    // then all we can do is show the link as is without making it clickable
    if (!absoluteFile) {
      return makeLine(key, [whitespace, `at ${fn} (${originalFile}:${line}:${column})`])
    }

    if (cypressLineRegex.test(originalFile || '')) {
      return makeLine(key, [whitespace, `at ${fn} (${originalFile}:${line}:${column})`])
    }

    const link = (
      <FileNameOpener key={key} className="runnable-err-file-path" fileDetails={stackLine as ParsedStackFileLine} />
    )

    return makeLine(key, [whitespace, `at ${fn} (`, link, ')'])
  })

  return <>{lines}</>
})

export default ErrorStack
