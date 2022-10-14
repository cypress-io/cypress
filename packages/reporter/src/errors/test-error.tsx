import _ from 'lodash'
import React, { MouseEvent } from 'react'
import cs from 'classnames'
import { observer } from 'mobx-react'
import Markdown from 'markdown-it'

import Collapsible from '../collapsible/collapsible'
import ErrorCodeFrame from '../errors/error-code-frame'
import ErrorStack from '../errors/error-stack'

import events from '../lib/events'
import FlashOnClick from '../lib/flash-on-click'
import { onEnterOrSpace } from '../lib/util'
import Attempt from '../attempts/attempt-model'
import Command from '../commands/command-model'
import { formattedMessage } from '../commands/command'

import WarningIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/warning_x8.svg'
import TerminalIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/technology-terminal_x16.svg'

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
  model: Command
  onPrintToConsole?: () => void
}

const TestError = observer((props: TestErrorProps) => {
  const md = new Markdown('zero')

  md.enable(['backticks', 'emphasis', 'escape'])

  const onPrint = props.onPrintToConsole || (() => {
    events.emit('show:error', props.model)
  })

  const _onPrintClick = (e: MouseEvent) => {
    e.stopPropagation()

    onPrint()
  }

  const err = props.model

  if (!err || !err.displayMessage) return null

  const { codeFrame } = err

  const groupPlaceholder: Array<JSX.Element> = []

  if (err.showRecoveredError) {
    // cap the group nesting to 5 levels to keep the log text legible
    for (let i = 0; i < props.groupLevel; i++) {
      groupPlaceholder.push(<span key={`${err.name}-err-${i}`} className='err-group-block' />)
    }
  }

  return (
    <div className={cs('runnable-err', { 'show-recovered-test-err': err.showRecoveredError }, props.customClassName)}>
      <div className={cs('runnable-err-header', { 'show-recovered-test-err!!': err.showRecoveredError })}>
        {groupPlaceholder}
        <div className={cs('runnable-err-name', { 'show-recovered-test-err!!!!': err.showRecoveredError })}>
          <WarningIcon />
          {err.name}
        </div>
      </div>
      <div className={cs('runnable-err-content', { 'show-recovered-test-err!!': err.showRecoveredError })}>
        {groupPlaceholder}
        <div>
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
                  <div tabIndex={-1}><TerminalIcon /> <span>Print to console</span></div>
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
    </div>
  )
})

export default TestError
