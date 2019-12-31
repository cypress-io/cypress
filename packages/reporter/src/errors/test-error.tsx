import _ from 'lodash'
import React from 'react'
import { observer } from 'mobx-react'
import Markdown from 'markdown-it'

import Collapsible from '../collapsible/collapsible'
import ErrorCodeFrame from '../errors/error-code-frame'
import { Events } from '../lib/events'
import TestModel from '../test/test-model'

interface Props {
  events: Events
  model: TestModel
}

const TestError = observer((props: Props) => {
  const md = new Markdown('zero')

  md.enable(['backticks', 'emphasis', 'escape'])

  const formattedMessage = (message?: string) => {
    return message ? md.renderInline(message) : ''
  }

  const { err } = props.model

  if (!err.message) return null

  return (
    <div className='runnable-err-wrapper'>
      <div className='runnable-err'>
        <div className='runnable-err-header'>
          <div className='runnbale-err-name'>
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
            {err.stack}
          </Collapsible> :
          null
        }
        {_.map(err.codeFrames, (codeFrame, i) => (
          <ErrorCodeFrame key={i} {...codeFrame} />
        ))}
      </div>
    </div>
  )
})

export default TestError
