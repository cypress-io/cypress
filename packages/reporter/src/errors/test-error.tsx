import _ from 'lodash'
import React, { MouseEvent } from 'react'
import { observer } from 'mobx-react'
import Markdown from 'markdown-it'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import Collapsible from '../collapsible/collapsible'
import ErrorCodeFrame from '../errors/error-code-frame'
import ErrorStack from '../errors/error-stack'

import events from '../lib/events'
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
        <i className='fas fa-external-link-alt'></i>
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

  const onPrint = (e: MouseEvent) => {
    e.stopPropagation()

    events.emit('show:error', props.model.id)
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

          <Tooltip title='Print error to console' className='cy-tooltip'>
            <button className='runnable-err-print' onClick={onPrint}>
              <i className='fas fa-terminal'></i>
            </button>
          </Tooltip>
        </div>
        <div className='runnable-err-message'>
          <span dangerouslySetInnerHTML={{ __html: formattedMessage(err.message) }}></span>
          <DocsUrl url={err.docsUrl} />
        </div>

        {err.stack &&
          <Collapsible
            header='View stack trace'
            headerClass='runnable-err-stack-expander'
            contentClass='runnable-err-stack-trace'
          >
            <ErrorStack err={err} />
          </Collapsible>
        }
        {codeFrame && <ErrorCodeFrame codeFrame={codeFrame} />}
      </div>
    </div>
  )
})

export default TestError
