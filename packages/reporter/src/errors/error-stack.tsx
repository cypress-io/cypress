import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { ReactElement } from 'react'

import FileNameOpener from '../lib/file-name-opener'
import type Err from './err-model'
import type { ParsedStackFileLine, ParsedStackMessageLine } from './err-model'

const cypressLineRegex = /(cypress:\/\/|cypress_runner\.js)/

interface Props {
  err: Err
}

type StringOrElement = string | ReactElement

const isMessageLine = (stackLine: ParsedStackFileLine | ParsedStackMessageLine) => {
  return (stackLine as ParsedStackMessageLine).message != null
}

const ErrorStack = observer(({ err }: Props) => {
  if (!err.parsedStack) return <>{err.stack}</>

  // only display stack lines beyond the original message, since it's already
  // displayed above this in the UI
  let foundFirstStackLine = false
  const stackLines = _.filter(err.parsedStack, (line) => {
    if (foundFirstStackLine) return true

    if (isMessageLine(line)) return false

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
    const whitespace = stackLine.whitespace.slice(commonWhitespaceLength)

    if (isMessageLine(stackLine)) {
      const message = (stackLine as ParsedStackMessageLine).message

      // we append some errors with 'node internals', which we don't want to link
      // so stop linking anything after 'From Node.js Internals'
      if (message.includes('From Node')) {
        stopLinking = true
      }

      return makeLine(`${message}${index}`, [whitespace, message])
    }

    const { originalFile, function: fn, line, column, absoluteFile } = stackLine as ParsedStackFileLine
    const key = `${originalFile}${index}`

    const dontLink = (
      // don't link to Node files, opening them in IDE won't work
      stopLinking
      // sometimes we can determine the file on disk, but if there are no
      // source maps or the file was transpiled in the browser, there
      // is no absoluteFile to link to
      || !absoluteFile
      // don't link to cypress internals, opening them in IDE won't work
      || cypressLineRegex.test(originalFile || '')
    )

    if (dontLink) {
      const lineAndColumn = (Number.isInteger(line) || Number.isInteger(column)) ? `:${line}:${column}` : ''

      return makeLine(key, [whitespace, `at ${fn} (${originalFile}${lineAndColumn})`])
    }

    const link = (
      <FileNameOpener key={key} className="runnable-err-file-path" fileDetails={stackLine as ParsedStackFileLine} />
    )

    return makeLine(key, [whitespace, `at ${fn} (`, link, ')'])
  })

  return <>{lines}</>
})

export default ErrorStack
