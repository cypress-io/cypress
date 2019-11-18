import React from 'react'
import { observer } from 'mobx-react'
import Collapsible from '../collapsible/collapsible'
import Markdown from 'markdown-it'

import ErrorCodeFrame from '../errors/error-code-frame'
import ErrorStack from '../errors/error-stack'
import events from '../lib/events'

const md = new Markdown('zero')

md.enable(['backticks', 'emphasis', 'escape'])

const formattedMessage = (message) => {
  return message ? md.renderInline(message) : ''
}

const openFile = (where) => ({ absoluteFile: file, line, column }) => {
  events.emit('open:file', {
    where,
    file,
    line,
    column,
  })
}

const TestError = observer(({ model }) => {
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
            <ErrorStack
              err={err}
              onOpenComputer={openFile('computer')}
              onOpenEditor={openFile('editor')}
            />
          </Collapsible> :
          null
        }
        {codeFrame &&
          <ErrorCodeFrame
            codeFrame={codeFrame}
            onOpenComputer={openFile('computer')}
            onOpenEditor={openFile('editor')}
          />
        }
      </div>
    </div>
  )
})

export default TestError
