import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Prism from 'prismjs'

@observer
class ErrorCodeFrame extends Component {
  componentDidMount () {
    Prism.highlightAllUnder(this.refs.codeFrame)
  }

  render () {
    return (
      <div className='test-error-code-frame'>
        <div className='runnable-err-code-frame-file-path'>users-flow/users-login.spec.js:26:17</div>
        <pre ref='codeFrame' data-line='2' className='line-numbers'>
          <code className='language-javascript'>cy.get('.as-table')
    .find('tbody>tr').eq(12)
    .find('td').first()
    .find('button').as('firstBtn').then(() => {})</code>
        </pre>
      </div>
    )
  }
}

export default ErrorCodeFrame
