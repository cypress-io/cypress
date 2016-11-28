import { observer } from 'mobx-react'
import React from 'react'

const BundleError = ({ specPath }) => (
  <div>
    <h4>
      <i className='fa fa-warning'></i>
      Oops...we found an error preparing this test file:
    </h4>
    <pre>{specPath}</pre>
    <p>This occurred while Cypress was compiling and bundling your test code. This is usually caused by:</p>
    <ul>
      <li>A missing file or dependency</li>
      <li>A syntax error in the file or one of its dependencies</li>
    </ul>
    <p>
      Fix the error in your code and re-run your tests.
      (<a href='https://on.cypress.io/we-found-an-error-preparing-your-test-file' target='_blank' rel='noopener noreferrer'>learn more</a>)
    </p>
  </div>
)

const ScriptError = observer(({ specPath, state }) => {
  if (!state.scriptError) return null

  function error () {
    switch (state.scriptError.type) {
      case "BUNDLE_ERROR":
        return <BundleError specPath={specPath} />
      default:
        return null
    }
  }

  return (
    <div className='runner script-error'>
      <aside style={{ width: state.reporterWidth }}>
        {error()}
      </aside>
      <main style={{ marginTop: state.headerHeight }}>
        <pre className='error-stack'>
          {state.scriptError.error.replace(/\{newline\}/g, '\n')}
        </pre>
      </main>
    </div>
  )
})

export default ScriptError
