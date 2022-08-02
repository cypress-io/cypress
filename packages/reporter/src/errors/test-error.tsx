import _ from 'lodash'
import React, { MouseEvent } from 'react'
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
  model: Attempt | Command
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

  const { err } = props.model
  const { codeFrame } = err

  if (!err.displayMessage) return null

  return (
    <div className='runnable-err-wrapper'>
      <div className='runnable-err'>
        <div className='runnable-err-header'>
          <div className='runnable-err-name'>
            <WarningIcon />
            {err.name}
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
  )
})

export default TestError
