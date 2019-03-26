import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Prism from 'prismjs'

@observer
class ErrorCodeFrame extends Component {
  componentDidMount () {
    Prism.highlightAll()
  }

  render () {
    return (
      <div className='test-error-code-frame'>
        <div className='runnable-err-code-frame-file-path'>users-flow/users-login.spec.js:26:17</div>
        <pre>
          <code className='language-javascript'>cy.get('.as-table')
    .find('tbody>tr').first()
    .find('td').first()
    .find('button').as('firstBtn')</code>
        </pre>
      </div>
    )
  }
}

export default ErrorCodeFrame
