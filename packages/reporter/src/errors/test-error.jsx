import _ from 'lodash'
import React from 'react'
import { observer } from 'mobx-react'
import Collapsible from '../collapsible/collapsible'
import Markdown from 'markdown-it'

import ErrorCodeFrame from '../errors/error-code-frame'

const md = new Markdown('zero')

md.enable(['backticks', 'emphasis', 'escape'])

const Stack = ({ err, onClick }) => {
  if (!err.parsedStack) return err.stack

  const makeLine = (key, content) => (
    <div key={key}>{content}</div>
  )

  return _.map(err.parsedStack, (stackLine, index) => {
    const key = `${relativeFile}${index}`

    if (stackLine.message != null) {
      return makeLine(key, stackLine.message)
    }

    const { relativeFile, line, column, function: fn, whitespace } = stackLine

    const onLinkClick = (e) => {
      e.preventDefault()

      onClick(stackLine)
    }

    const link = (
      <a onClick={onLinkClick} key={key} href='#'>
        {relativeFile}:{line}:{column}
      </a>
    )

    stackLine = [whitespace, `at ${fn} (`, link, ')']

    return makeLine(key, stackLine)
  })
}

const formattedMessage = (message) => {
  return message ? md.renderInline(message) : ''
}

const TestError = observer(({ model, onOpenFile }) => {
  const { err } = model
  const { codeFrame } = err

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
            <Stack err={err} onClick={onOpenFile} />
          </Collapsible> :
          null
        }
        {codeFrame &&
          <ErrorCodeFrame codeFrame={codeFrame} onOpenFile={onOpenFile} />
        }
      </div>
    </div>
  )
})

export default TestError
