import _ from 'lodash'
import React, { MouseEvent } from 'react'
import { observer } from 'mobx-react'
import Markdown from 'markdown-it'

import Collapsible from '../collapsible/collapsible'
import ErrorCodeFrame from '../errors/error-code-frame'
import ErrorStack from '../errors/error-stack'
import { HookHeader } from '../hooks/hooks'

import events from '../lib/events'
import FlashOnClick from '../lib/flash-on-click'
import { onEnterOrSpace } from '../lib/util'
import Attempt from '../attempts/attempt-model'

const md = new Markdown('zero')

md.enable(['backticks', 'emphasis', 'escape'])

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
  model: Attempt
}

const TestError = observer((props: TestErrorProps) => {
  const onPrint = () => {
    events.emit('show:error', props.model)
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

  const allErrs = [err].concat(props.model.errs || [])

  return allErrs.map((err, i) => {
    const hook = err.failedFromHookId && _.find(props.model.hooks, { hookId: err.failedFromHookId })

    return (
      <div key={i} className='runnable-err-wrapper'>
        <div className='runnable-err'>
          <div className='runnable-err-header'>
            <div className='runnable-err-name'>
              <i className='fas fa-exclamation-circle' />
              {err.name} {hook && <span className="error-hookname" ><HookHeader name={hook.hookName} number={hook.hookNumber}/></span>}
            </div>
          </div>
          <div className='runnable-err-message'>
            <span dangerouslySetInnerHTML={{ __html: formattedMessage(err.message) }} />
            <DocsUrl url={err.docsUrl} />
          </div>
          {codeFrame && <ErrorCodeFrame codeFrame={codeFrame} />}
          {err.stack &&
          <Collapsible
            header='View stack trace'
            headerClass='runnable-err-stack-expander'
            headerExtras={
              <FlashOnClick onClick={_onPrintClick} message="Printed output to your console">
                <div
                  className="runnable-err-print"
                  onKeyPress={onEnterOrSpace(onPrint)}
                  role='button'
                  tabIndex={0}
                >
                  <div tabIndex={-1}><i className="fas fa-terminal" /> <span>Print to console</span></div>
                </div>
              </FlashOnClick>
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
})

export default TestError
