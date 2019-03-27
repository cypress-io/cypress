import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Collapsible from '../collapsible/collapsible'

import ErrorCodeFrame from '../errors/error-code-frame'

@observer
class TestError extends Component {
  render () {
    const { err } = this.props.model

    if (!err.displayMessage) return null

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
          {_.map(err.codeFrames, (codeFrame) => (
            <ErrorCodeFrame {...codeFrame} />
          ))}
        </div>
      </div>
    )
  }
}

export default TestError

