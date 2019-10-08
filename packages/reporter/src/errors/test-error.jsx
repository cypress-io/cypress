import _ from 'lodash'
import React from 'react'
import { observer } from 'mobx-react'
import Collapsible from '../collapsible/collapsible'
import Markdown from 'markdown-it'

import ErrorCodeFrame from '../errors/error-code-frame'

const md = new Markdown('zero')

md.enable(['backticks', 'emphasis', 'escape'])

const stackLineRegex = /^\s*at .*?\((.*)\)/
const filePathRegex = /^(.*?):(\d+):(\d+$)/

const parseFilePath = (filePath) => {
  // eslint-disable-next-line no-unused-vars
  let [__, file, line, column] = filePath.match(filePathRegex) || []

  return {
    file: file || filePath,
    line: _.toInteger(line) || 0,
    column: _.toInteger(column || 0) + 1,
  }
}

const StackWithLinks = ({ stack, onClick }) => {
  if (!stack) return ''

  const lines = stack.split('\n')

  return _.map(lines, (stackLine, index) => {
    // eslint-disable-next-line no-unused-vars
    const [__, filePath] = stackLine.match(stackLineRegex) || []

    if (filePath) {
      const splitLine = stackLine.split(filePath)
      const fileObject = parseFilePath(filePath)
      const { file, line, column } = fileObject

      const onLinkClick = (e) => {
        e.preventDefault()

        onClick(fileObject)
      }

      const link = (
        <a onClick={onLinkClick} key={`${filePath}${index}`} href='#'>
          {file}:{line}:{column}
        </a>
      )

      splitLine.splice(1, 0, link)
      stackLine = splitLine
    }

    return (
      <div key={`${stackLine}${index}`}>{stackLine}</div>
    )
  })
}

const formattedMessage = (message) => {
  return message ? md.renderInline(message) : ''
}

const TestError = observer(({ model, onOpenFile }) => {
  const { err } = model

  if (!err.displayMessage) return null

  return (
    <div className='runnable-err-wrapper'>
      <div className='runnable-err'>
        <div className='runnable-err-header'>
          <div className='runnable-err-name'>
            <i className='fa fa-exclamation-circle'></i>
            {err.name}
          </div>
          {
            err.docsUrl ?
              <div className='runnable-err-docs-url'>
                <a href={err.docsUrl} target='_blank'>Learn more</a>
                <i className='fa fa-external-link'></i>
              </div> :
              null
          }
        </div>
        <div className='runnable-err-message' dangerouslySetInnerHTML={{ __html: formattedMessage(err.message) }}></div>
        {err.stack ?
          <Collapsible
            header='View stack trace'
            headerClass='runnable-err-stack-expander'
            contentClass='runnable-err-stack-trace'
          >
            <StackWithLinks
              stack={err.sourceMappedStack || err.stack}
              onClick={onOpenFile}
            />
          </Collapsible> :
          null
        }
        {_.map(err.codeFrames, (codeFrame) => (
          <ErrorCodeFrame
            key={`${codeFrame.file}:${codeFrame.column}:${codeFrame.line}`}
            codeFrame={codeFrame}
            onOpenFile={onOpenFile}
          />
        ))}
      </div>
    </div>
  )
})

export default TestError
