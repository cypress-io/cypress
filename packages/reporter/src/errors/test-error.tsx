import _ from 'lodash'
import React, { MouseEvent } from 'react'
import { observer } from 'mobx-react'
import Markdown from 'markdown-it'

import Collapsible from '../collapsible/collapsible'
import ErrorCodeFrame from '../errors/error-code-frame'
import ErrorStack from '../errors/error-stack'

import events from '../lib/events'
import FlashOnClick from '../lib/flash-on-click'
import { indentPadding, onEnterOrSpace } from '../lib/util'
import { ErrModel } from './err-model'
import { VirtualizableProps } from '../virtual-tree/virtualizable-types'
import { measureOnChange } from '../virtual-tree/virtualizable-util'

interface DocsUrlProps {
  url: string | string[]
}

const DocsUrl = ({ url }: DocsUrlProps) => {
  if (!url) return null

  const urlArray = _.castArray(url)

  return (<>
    {_.map(urlArray, (url) => (
      <a className='test-err-docs-url' href={url} target='_blank' key={url}>
        Learn more
      </a>
    ))}
  </>)
}

interface TestErrorProps {
  model: ErrModel
  isTestError?: boolean
  virtualizableProps: VirtualizableProps
}

export const TestError = observer(({ model, virtualizableProps }: TestErrorProps) => {
  measureOnChange(virtualizableProps, () => {
    // list any observable properties that may affect the height or width
    // of the rendered DOM, in order to tell react-virtualized-tree
    // to re-measure when they change
    model.name
    model.message
    model.stack
    model.codeFrame
  })

  const md = new Markdown('zero')

  md.enable(['backticks', 'emphasis', 'escape'])

  const onPrint = () => {
    events.emit('show:error', model.attempt)
  }

  const onPrintClick = (e: MouseEvent) => {
    e.stopPropagation()

    onPrint()
  }

  const formattedMessage = (message?: string) => {
    return message ? md.renderInline(message) : ''
  }

  if (!model) return null

  const { codeFrame } = model

  if (!model.displayMessage) return null

  return (
    <div
      className={`test-err runnable-state-${model.attempt!.test.state}`}
      style={indentPadding(virtualizableProps.style, model.level)}
    >
      <div className='hooks-container'>
        <div className='test-err-wrapper'>
          <div className='test-err-header'>
            <div className='test-err-name'>
              <i className='fas fa-exclamation-circle' />
              {model.name}
            </div>
          </div>
          <div className='test-err-message'>
            <span dangerouslySetInnerHTML={{ __html: formattedMessage(model.message) }} />
            <DocsUrl url={model.docsUrl} />
          </div>
          {codeFrame && <ErrorCodeFrame codeFrame={codeFrame} />}
          {model.stack &&
          <Collapsible
            header='View stack trace'
            headerClass='test-err-stack-expander'
            headerExtras={
              <FlashOnClick onClick={onPrintClick} message="Printed output to your console">
                <div
                  className="test-err-print"
                  onKeyPress={onEnterOrSpace(onPrint)}
                  role='button'
                  tabIndex={0}
                >
                  <div tabIndex={-1}><i className="fas fa-terminal" /> <span>Print to console</span></div>
                </div>
              </FlashOnClick>
            }
            contentClass='test-err-stack-trace'
            onToggle={virtualizableProps.measure}
          >
            <ErrorStack err={model} />
          </Collapsible>
          }
        </div>
      </div>
    </div>
  )
})
