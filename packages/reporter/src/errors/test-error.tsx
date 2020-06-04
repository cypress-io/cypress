import _ from 'lodash'
import React, { MouseEvent } from 'react'
import { observer } from 'mobx-react'
import Markdown from 'markdown-it'

import Collapsible from '../collapsible/collapsible'
import ErrorCodeFrame from '../errors/error-code-frame'
import ErrorStack from '../errors/error-stack'

import events from '../lib/events'
import { onEnterOrSpace } from '../lib/util'
import TestModel from '../test/test-model'

interface DocsUrlProps {
  url: string | string[]
}

const DocsUrl = ({ url }: DocsUrlProps) => {
  if (!url) return null

  const urlArray = _.castArray(url)

  return (<>
    {_.map(urlArray, (url) => (
      <a className='runnable-err-docs-url' href={url} target='_blank' key={url}>
        Learn more
      </a>
    ))}
  </>)
}

interface TestErrorProps {
  model: TestModel
}

const TestError = observer((props: TestErrorProps) => {
  const md = new Markdown('zero')

  md.enable(['backticks', 'emphasis', 'escape'])

  const onPrint = () => {
    events.emit('show:error', props.model.id)
  }

  const _onPrintClick = (e: MouseEvent) => {
    e.stopPropagation()

    onPrint()
  }

  const formattedMessage = (message?: string) => {
    return message ? md.renderInline(message) : ''
  }

  const { err } = props.model
  const { codeFrame } = err

  if (!err.displayMessage) return null

  return (
    <div className='runnable-err-wrapper'>
      <div className='runnable-err'>
        <div className='runnable-err-header'>
          <div className='runnable-err-name'>
            <i className='fas fa-exclamation-circle'></i>
            {err.name}
          </div>
        </div>
        <div className='runnable-err-message'>
          <span dangerouslySetInnerHTML={{ __html: formattedMessage(err.message) }}></span>
          <DocsUrl url={err.docsUrl} />
        </div>
        {codeFrame && <ErrorCodeFrame codeFrame={codeFrame} />}
        {err.stack &&
          <Collapsible
            header='View stack trace'
            headerClass='runnable-err-stack-expander'
            headerExtras={
              <div
                className="runnable-err-print"
                onClick={_onPrintClick}
                onKeyPress={onEnterOrSpace(onPrint)}
                role='button'
                tabIndex={0}
              >
                <i className="fas fa-terminal" /> <span>Print to console</span>
              </div>
            }
            contentClass='runnable-err-stack-trace'
          >
            <ErrorStack err={err} />
          </Collapsible>
        }
      </div>
    </div>
  )
})

export default TestError
