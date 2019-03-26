import React from 'react'
import FlashOnClick from '../lib/flash-on-click'
import Collapsible from '../collapsible/collapsible'

function TestError (props) {
  function _onErrorClick (e) {
    e.stopPropagation()

    props.events.emit('show:error', props.model.id)
  }

  const { err } = props.model

  if (!err.displayMessage) return null

  return (
    <div className='runnable-err-wrapper'>
      <div className='runnable-err'>
        <div className='runnable-err-header'>
          <div className='runnbale-err-name'>
            <i className='fa fa-exclamation-circle'></i>
            {err.name}
          </div>
          <div className='runnable-err-docs-url'>
            <a href='https://on.cypress.io/type' target='_blank'>
              Learn more
            </a>
            <i className='fa fa-external-link'></i>
          </div>
        </div>
        <div className='runnable-err-message' dangerouslySetInnerHTML={{ __html: err.message }}></div>
        {err.stack ?
          <Collapsible
            header='See full stack trace'
            headerClass='runnable-err-stack-expander'
            contentClass='runnable-err-stack-trace'
          >
            {err.stack}
          </Collapsible> :
          null
        }

          <pre className='test-error'>
            <div className='runnable-err-code-frame-file-path'>users-flow/users-login.spec.js:26:17</div>
          </pre>
      </div>
    </div>
  )
}

export default TestError
